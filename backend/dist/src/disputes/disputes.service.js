"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let DisputesService = class DisputesService {
    prisma;
    auditService;
    notificationService;
    constructor(prisma, auditService, notificationService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }
    async create(dto, userId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transaction_id },
            include: { dispute: true },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        if (transaction.dispute)
            throw new common_1.BadRequestException('Dispute already exists for this transaction');
        if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
            throw new common_1.ForbiddenException('You are not a participant in this transaction');
        }
        const respondentId = transaction.buyer_id === userId ? transaction.seller_id : transaction.buyer_id;
        return this.prisma.$transaction(async (tx) => {
            const dispute = await tx.dispute.create({
                data: {
                    transaction_id: dto.transaction_id,
                    initiator_id: userId,
                    respondent_id: respondentId,
                    reason: dto.reason,
                    description: dto.description,
                    amount_claimed: dto.amount_claimed,
                    status: client_1.DisputeStatus.OPEN,
                    evidence_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                },
            });
            await tx.transaction.update({
                where: { id: dto.transaction_id },
                data: { status: client_1.TransactionStatus.disputed },
            });
            await this.notificationService.create({
                type: 'dispute_initiated',
                title: 'Dispute Initiated',
                message: `A dispute has been opened for your transaction #${dto.transaction_id.substring(0, 8)}.`,
                priority: 'urgent',
            }, respondentId);
            return dispute;
        });
    }
    async findAll(userId, role) {
        const where = {};
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
    async findOne(id, userId, role) {
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
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (role !== 'admin' && dispute.initiator_id !== userId && dispute.respondent_id !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return dispute;
    }
    async addEvidence(disputeId, dto, userId) {
        const dispute = await this.findOne(disputeId, userId, 'user');
        if (dispute.status === client_1.DisputeStatus.CLOSED || dispute.status === client_1.DisputeStatus.RESOLVED) {
            throw new common_1.BadRequestException('Cannot add evidence to a closed or resolved dispute');
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
        const recipientId = dispute.initiator_id === userId ? dispute.respondent_id : dispute.initiator_id;
        await this.notificationService.create({
            type: 'dispute_evidence_required',
            title: 'New Evidence Uploaded',
            message: `New evidence has been uploaded for your dispute regarding transaction #${dispute.transaction_id.substring(0, 8)}.`,
            priority: 'medium',
        }, recipientId);
        return evidence;
    }
    async addMessage(disputeId, dto, userId, isAdmin = false) {
        const dispute = await this.findOne(disputeId, userId, isAdmin ? 'admin' : 'user');
        if (dto.is_internal && !isAdmin) {
            throw new common_1.ForbiddenException('Internal messages can only be added by admins');
        }
        const message = await this.prisma.disputeMessage.create({
            data: {
                dispute_id: disputeId,
                sender_id: userId,
                content: dto.content,
                is_internal: dto.is_internal || false,
            },
        });
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
    async assignMember(disputeId, adminId, adminContext) {
        const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        const updatedDispute = await this.prisma.dispute.update({
            where: { id: disputeId },
            data: {
                assigned_admin_id: adminId,
                status: client_1.DisputeStatus.UNDER_REVIEW,
            },
        });
        await this.auditService.log({
            performedBy: adminContext,
            action: 'disputes.assign',
            resourceType: 'Dispute',
            resourceId: disputeId,
            afterState: { assigned_admin_id: adminId, status: client_1.DisputeStatus.UNDER_REVIEW },
            riskLevel: client_1.RiskLevel.low,
            status: client_1.AuditStatus.success,
        });
        return updatedDispute;
    }
    async resolve(disputeId, dto, adminContext) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { transaction: true },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (dispute.status === client_1.DisputeStatus.RESOLVED)
            throw new common_1.BadRequestException('Dispute already resolved');
        return this.prisma.$transaction(async (tx) => {
            const updatedDispute = await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: client_1.DisputeStatus.RESOLVED,
                    resolution: dto.resolution,
                    resolution_notes: dto.notes,
                    resolved_at: new Date(),
                },
            });
            let newTxStatus;
            switch (dto.resolution) {
                case client_1.DisputeResolution.REFUND_BUYER:
                    newTxStatus = client_1.TransactionStatus.refunded;
                    break;
                case client_1.DisputeResolution.RELEASE_SELLER:
                    newTxStatus = client_1.TransactionStatus.released;
                    break;
                case client_1.DisputeResolution.PARTIAL_REFUND:
                case client_1.DisputeResolution.DISMISSED:
                default:
                    newTxStatus = client_1.TransactionStatus.paid;
                    break;
            }
            await tx.transaction.update({
                where: { id: dispute.transaction_id },
                data: { status: newTxStatus },
            });
            await this.auditService.log({
                performedBy: adminContext,
                action: 'disputes.resolve',
                resourceType: 'Dispute',
                resourceId: disputeId,
                reason: dto.notes,
                beforeState: { status: dispute.status },
                afterState: { status: client_1.DisputeStatus.RESOLVED, resolution: dto.resolution, transactionStatus: newTxStatus },
                riskLevel: client_1.RiskLevel.critical,
                status: client_1.AuditStatus.success,
            });
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
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map