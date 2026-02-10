import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    VerificationRequestStatus,
    VerificationDocumentStatus,
    VerificationScope,
    VerificationDocumentStatus as DocStatus
} from '@prisma/client';
import { CreateVerificationRequestDto } from './dto/create-request.dto';
import { SubmitDocumentDto } from './dto/submit-document.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class VerificationsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private notificationService: NotificationService
    ) { }

    // --- User Actions ---

    async createRequest(userId: string, dto: CreateVerificationRequestDto) {
        // Enforce one active request per scope per target
        const existing = await this.prisma.verificationRequest.findFirst({
            where: {
                user_id: userId,
                scope: dto.scope,
                listing_id: dto.listing_id || null,
                status: { in: [VerificationRequestStatus.PENDING, VerificationRequestStatus.IN_REVIEW] }
            }
        });

        if (existing) {
            throw new BadRequestException('An active verification request already exists for this scope');
        }

        return this.prisma.verificationRequest.create({
            data: {
                user_id: userId,
                scope: dto.scope,
                listing_id: dto.listing_id,
                transaction_id: dto.transaction_id,
                status: VerificationRequestStatus.PENDING
            }
        });
    }

    async submitDocument(userId: string, requestId: string, dto: SubmitDocumentDto) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) throw new NotFoundException('Request not found');
        if (request.user_id !== userId) throw new ForbiddenException('Access denied');

        if (request.status === VerificationRequestStatus.APPROVED) {
            throw new BadRequestException('Cannot add documents to an already approved request');
        }

        return this.prisma.verificationDocument.create({
            data: {
                request_id: requestId,
                type_id: dto.type_id,
                uploader_id: userId,
                file_url: dto.file_url,
                file_name: dto.file_name,
                file_size: dto.file_size,
                file_type: dto.file_type,
                issue_date: dto.issue_date ? new Date(dto.issue_date) : null,
                expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
                status: VerificationDocumentStatus.PENDING
            }
        });
    }

    async getMyRequests(userId: string) {
        return this.prisma.verificationRequest.findMany({
            where: { user_id: userId },
            include: {
                documents: {
                    include: { type: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    // --- Admin Actions ---

    async findAllForAdmin(filters: any) {
        return this.prisma.verificationRequest.findMany({
            where: filters,
            include: {
                user: { select: { full_name: true, email: true } },
                listing: { select: { title: true } },
                documents: { include: { type: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async reviewRequest(requestId: string, adminId: string, dto: ReviewRequestDto, adminContext: any) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { documents: true }
        });

        if (!request) throw new NotFoundException('Request not found');

        const updatedRequest = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.verificationRequest.update({
                where: { id: requestId },
                data: {
                    status: dto.status,
                    assigned_admin_id: adminId,
                    rejection_reason: dto.rejection_reason,
                    admin_notes: dto.admin_notes,
                    confidence_score: dto.confidence_score,
                    last_review_at: new Date()
                }
            });

            // Logic: Impact on linked entities
            if (dto.status === VerificationRequestStatus.APPROVED) {
                // If it's a listing verification, mark listing as verified
                if (request.listing_id) {
                    await tx.listing.update({
                        where: { id: request.listing_id },
                        data: { verified: true }
                    });
                }

                // If it's user identity, mark user as verified
                if (request.scope === VerificationScope.USER_IDENTITY) {
                    await tx.user.update({
                        where: { id: request.user_id },
                        data: { verified: true }
                    });
                }
            }

            return updated;
        });

        // Notifications
        await this.notificationService.create({
            type: dto.status === VerificationRequestStatus.APPROVED ? 'verification_approved' : 'verification_rejected',
            title: `Verification ${dto.status.toLowerCase()}`,
            message: dto.status === VerificationRequestStatus.APPROVED
                ? `Your ${request.scope.toLowerCase()} verification has been approved.`
                : `Your verification was rejected: ${dto.rejection_reason}`,
            priority: 'high'
        }, request.user_id);

        // Audit Log
        await this.auditService.log({
            performedBy: adminContext,
            action: 'verification.review',
            resourceType: 'VerificationRequest',
            resourceId: requestId,
            afterState: { status: dto.status, confidence: dto.confidence_score },
            riskLevel: 'medium' as any,
            status: 'success' as any
        });

        return updatedRequest;
    }

    async reviewDocument(docId: string, status: VerificationDocumentStatus, adminId: string, reason?: string) {
        return this.prisma.verificationDocument.update({
            where: { id: docId },
            data: {
                status,
                rejection_reason: reason
            }
        });
    }

    async getDocumentTypes(scope?: VerificationScope) {
        return this.prisma.verificationDocumentType.findMany({
            where: scope ? { scope } : {}
        });
    }
}
