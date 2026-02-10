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
exports.VerificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../common/services/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
let VerificationsService = class VerificationsService {
    prisma;
    auditService;
    notificationService;
    constructor(prisma, auditService, notificationService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }
    async createRequest(userId, dto) {
        const existing = await this.prisma.verificationRequest.findFirst({
            where: {
                user_id: userId,
                scope: dto.scope,
                listing_id: dto.listing_id || null,
                status: { in: [client_1.VerificationRequestStatus.PENDING, client_1.VerificationRequestStatus.IN_REVIEW] }
            }
        });
        if (existing) {
            throw new common_1.BadRequestException('An active verification request already exists for this scope');
        }
        return this.prisma.verificationRequest.create({
            data: {
                user_id: userId,
                scope: dto.scope,
                listing_id: dto.listing_id,
                transaction_id: dto.transaction_id,
                status: client_1.VerificationRequestStatus.PENDING
            }
        });
    }
    async submitDocument(userId, requestId, dto) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.user_id !== userId)
            throw new common_1.ForbiddenException('Access denied');
        if (request.status === client_1.VerificationRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Cannot add documents to an already approved request');
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
                status: client_1.VerificationDocumentStatus.PENDING
            }
        });
    }
    async getMyRequests(userId) {
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
    async findAllForAdmin(filters) {
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
    async reviewRequest(requestId, adminId, dto, adminContext) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { documents: true }
        });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
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
            if (dto.status === client_1.VerificationRequestStatus.APPROVED) {
                if (request.listing_id) {
                    await tx.listing.update({
                        where: { id: request.listing_id },
                        data: { verified: true }
                    });
                }
                if (request.scope === client_1.VerificationScope.USER_IDENTITY) {
                    await tx.user.update({
                        where: { id: request.user_id },
                        data: { verified: true }
                    });
                }
            }
            return updated;
        });
        await this.notificationService.create({
            type: dto.status === client_1.VerificationRequestStatus.APPROVED ? 'verification_approved' : 'verification_rejected',
            title: `Verification ${dto.status.toLowerCase()}`,
            message: dto.status === client_1.VerificationRequestStatus.APPROVED
                ? `Your ${request.scope.toLowerCase()} verification has been approved.`
                : `Your verification was rejected: ${dto.rejection_reason}`,
            priority: 'high'
        }, request.user_id);
        await this.auditService.log({
            performedBy: adminContext,
            action: 'verification.review',
            resourceType: 'VerificationRequest',
            resourceId: requestId,
            afterState: { status: dto.status, confidence: dto.confidence_score },
            riskLevel: 'medium',
            status: 'success'
        });
        return updatedRequest;
    }
    async reviewDocument(docId, status, adminId, reason) {
        return this.prisma.verificationDocument.update({
            where: { id: docId },
            data: {
                status,
                rejection_reason: reason
            }
        });
    }
    async getDocumentTypes(scope) {
        return this.prisma.verificationDocumentType.findMany({
            where: scope ? { scope } : {}
        });
    }
};
exports.VerificationsService = VerificationsService;
exports.VerificationsService = VerificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationService])
], VerificationsService);
//# sourceMappingURL=verifications.service.js.map