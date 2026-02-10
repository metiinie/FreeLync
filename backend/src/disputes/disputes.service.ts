import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../notifications/notifications.service';
import { DisputeStatus, DisputeResolution, TransactionStatus, RiskLevel, AuditStatus } from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { AddMessageDto } from './dto/add-message.dto';

@Injectable()
export class DisputesService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private notificationService: NotificationService,
    ) { }

    async create(dto: CreateDisputeDto, userId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transaction_id },
            include: { dispute: true },
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.dispute) throw new BadRequestException('Dispute already exists for this transaction');
        if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
            throw new ForbiddenException('You are not a participant in this transaction');
        }

        const respondentId = transaction.buyer_id === userId ? transaction.seller_id : transaction.buyer_id;

        // Use transaction to ensure consistency
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Dispute
            const dispute = await tx.dispute.create({
                data: {
                    transaction_id: dto.transaction_id,
                    initiator_id: userId,
                    respondent_id: respondentId,
                    reason: dto.reason,
                    description: dto.description,
                    amount_claimed: dto.amount_claimed,
                    status: DisputeStatus.OPEN,
                    evidence_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours deadline
                },
            });

            // 2. Update Transaction Status
            await tx.transaction.update({
                where: { id: dto.transaction_id },
                data: { status: TransactionStatus.disputed },
            });

            // 3. Notify Respondent
            await this.notificationService.create({
                type: 'dispute_initiated',
                title: 'Dispute Initiated',
                message: `A dispute has been opened for your transaction #${dto.transaction_id.substring(0, 8)}.`,
                priority: 'urgent',
            }, respondentId);

            return dispute;
        });
    }

    async findAll(userId: string, role: string) {
        const where: any = {};
        if (role !== 'admin') {
            where.OR = [
                { initiator_id: userId },
                { respondent_id: userId },
            ];
        }

        return this.prisma.dispute.findMany({
            where,
            include: {
                transaction: true,
                initiator: { select: { full_name: true, email: true } },
                respondent: { select: { full_name: true, email: true } },
                assigned_admin: { select: { full_name: true, email: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string, userId: string, role: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                transaction: true,
                initiator: { select: { full_name: true, email: true } },
                respondent: { select: { full_name: true, email: true } },
                assigned_admin: { select: { full_name: true, email: true } },
                evidence: { include: { uploader: { select: { full_name: true } } } },
                messages: { include: { sender: { select: { full_name: true } } }, orderBy: { created_at: 'asc' } },
            },
        });

        if (!dispute) throw new NotFoundException('Dispute not found');

        if (role !== 'admin' && dispute.initiator_id !== userId && dispute.respondent_id !== userId) {
            throw new ForbiddenException('Access denied');
        }

        return dispute;
    }

    async addEvidence(disputeId: string, dto: AddEvidenceDto, userId: string) {
        const dispute = await this.findOne(disputeId, userId, 'user');

        if (dispute.status === DisputeStatus.CLOSED || dispute.status === DisputeStatus.RESOLVED) {
            throw new BadRequestException('Cannot add evidence to a closed or resolved dispute');
        }

        const evidence = await this.prisma.disputeEvidence.create({
            data: {
                dispute_id: disputeId,
                uploader_id: userId,
                file_url: dto.file_url,
                file_type: dto.file_type,
                description: dto.description,
            },
        });

        // Notify other party
        const recipientId = dispute.initiator_id === userId ? dispute.respondent_id : dispute.initiator_id;
        await this.notificationService.create({
            type: 'dispute_evidence_required', // Or a new type 'dispute_evidence_uploaded'
            title: 'New Evidence Uploaded',
            message: `New evidence has been uploaded for your dispute regarding transaction #${dispute.transaction_id.substring(0, 8)}.`,
            priority: 'medium',
        }, recipientId);

        return evidence;
    }

    async addMessage(disputeId: string, dto: AddMessageDto, userId: string, isAdmin = false) {
        const dispute = await this.findOne(disputeId, userId, isAdmin ? 'admin' : 'user');

        if (dto.is_internal && !isAdmin) {
            throw new ForbiddenException('Internal messages can only be added by admins');
        }

        const message = await this.prisma.disputeMessage.create({
            data: {
                dispute_id: disputeId,
                sender_id: userId,
                content: dto.content,
                is_internal: dto.is_internal || false,
            },
        });

        // Notify other party (if not internal)
        if (!dto.is_internal) {
            const recipientId = dispute.initiator_id === userId ? dispute.respondent_id : dispute.initiator_id;
            await this.notificationService.create({
                type: 'dispute_message',
                title: 'New Dispute Message',
                message: `You have a new message regarding your dispute for transaction #${dispute.transaction_id.substring(0, 8)}.`,
                priority: 'medium',
            }, recipientId);
        }

        return message;
    }

    // Admin-specific actions
    async assignMember(disputeId: string, adminId: string, adminContext: any) {
        const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) throw new NotFoundException('Dispute not found');

        const updatedDispute = await this.prisma.dispute.update({
            where: { id: disputeId },
            data: {
                assigned_admin_id: adminId,
                status: DisputeStatus.UNDER_REVIEW,
            },
        });

        await this.auditService.log({
            performedBy: adminContext,
            action: 'disputes.assign',
            resourceType: 'Dispute',
            resourceId: disputeId,
            afterState: { assigned_admin_id: adminId, status: DisputeStatus.UNDER_REVIEW },
            riskLevel: RiskLevel.low,
            status: AuditStatus.success,
        });

        return updatedDispute;
    }

    async resolve(disputeId: string, dto: ResolveDisputeDto, adminContext: any) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { transaction: true },
        });

        if (!dispute) throw new NotFoundException('Dispute not found');
        if (dispute.status === DisputeStatus.RESOLVED) throw new BadRequestException('Dispute already resolved');

        return this.prisma.$transaction(async (tx) => {
            // 1. Update Dispute
            const updatedDispute = await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: DisputeStatus.RESOLVED,
                    resolution: dto.resolution,
                    resolution_notes: dto.notes,
                    resolved_at: new Date(),
                },
            });

            // 2. Update Transaction based on resolution
            let newTxStatus: TransactionStatus;
            switch (dto.resolution) {
                case DisputeResolution.REFUND_BUYER:
                    newTxStatus = TransactionStatus.refunded;
                    break;
                case DisputeResolution.RELEASE_SELLER:
                    newTxStatus = TransactionStatus.released;
                    break;
                case DisputeResolution.PARTIAL_REFUND:
                case DisputeResolution.DISMISSED:
                default:
                    newTxStatus = TransactionStatus.paid; // Or a specific status for dismissed
                    break;
            }

            await tx.transaction.update({
                where: { id: dispute.transaction_id },
                data: { status: newTxStatus },
            });

            // 3. Audit Log
            await this.auditService.log({
                performedBy: adminContext,
                action: 'disputes.resolve',
                resourceType: 'Dispute',
                resourceId: disputeId,
                reason: dto.notes,
                beforeState: { status: dispute.status },
                afterState: { status: DisputeStatus.RESOLVED, resolution: dto.resolution, transactionStatus: newTxStatus },
                riskLevel: RiskLevel.critical,
                status: AuditStatus.success,
            });

            // 4. Notifications
            const participants = [dispute.initiator_id, dispute.respondent_id];
            for (const pId of participants) {
                await this.notificationService.create({
                    type: 'dispute_resolved',
                    title: 'Dispute Resolved',
                    message: `Dispute for transaction #${dispute.transaction_id.substring(0, 8)} has been resolved: ${dto.resolution}.`,
                    priority: 'high',
                }, pId);
            }

            return updatedDispute;
        });
    }
}
