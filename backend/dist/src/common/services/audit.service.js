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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(data) {
        return this.prisma.auditLog.create({
            data: {
                performed_by_id: data.performedBy.userId,
                performed_by_role: data.performedBy.role,
                performed_by_ip: data.performedBy.ip,
                performed_by_user_agent: data.performedBy.userAgent,
                action: data.action,
                resource_type: data.resourceType,
                resource_id: data.resourceId,
                reason: data.reason,
                justification: data.justification,
                before_state: data.beforeState,
                after_state: data.afterState,
                changes: data.changes,
                risk_level: data.riskLevel,
                status: data.status,
                error_message: data.errorMessage,
                metadata: data.metadata || {},
                session_id: data.performedBy.sessionId,
                request_id: data.requestId,
            },
        });
    }
    async getAuditTrail(filters) {
        const where = {};
        if (filters.userId)
            where.performed_by_id = filters.userId;
        if (filters.action)
            where.action = filters.action;
        if (filters.resourceType)
            where.resource_type = filters.resourceType;
        if (filters.resourceId)
            where.resource_id = filters.resourceId;
        if (filters.riskLevel)
            where.risk_level = filters.riskLevel;
        if (filters.status)
            where.status = filters.status;
        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate)
                where.created_at.gte = filters.startDate;
            if (filters.endDate)
                where.created_at.lte = filters.endDate;
        }
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    performed_by: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            role: true,
                        },
                    },
                    approved_by: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                take: filters.limit || 100,
                skip: filters.offset || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { data, total };
    }
    async getResourceHistory(resourceType, resourceId) {
        return this.prisma.auditLog.findMany({
            where: {
                resource_type: resourceType,
                resource_id: resourceId,
            },
            include: {
                performed_by: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });
    }
    async getAdminActivity(adminId, startDate, endDate) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                performed_by_id: adminId,
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        const actionsByType = this.groupBy(logs, 'action');
        const actionsByRisk = this.groupBy(logs, 'risk_level');
        const successCount = logs.filter((log) => log.status === 'success').length;
        const successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;
        return {
            totalActions: logs.length,
            actionsByType,
            actionsByRisk,
            successRate,
            timeline: this.buildTimeline(logs),
        };
    }
    async getHighRiskActions(limit = 50) {
        return this.prisma.auditLog.findMany({
            where: {
                risk_level: {
                    in: ['high', 'critical'],
                },
            },
            include: {
                performed_by: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }
    async getFailedActions(limit = 50) {
        return this.prisma.auditLog.findMany({
            where: {
                status: 'failure',
            },
            include: {
                performed_by: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }
    async archiveOldLogs(beforeDate) {
        const result = await this.prisma.auditLog.updateMany({
            where: {
                created_at: {
                    lt: beforeDate,
                },
                archived: false,
            },
            data: {
                archived: true,
            },
        });
        return result.count;
    }
    groupBy(logs, field) {
        return logs.reduce((acc, log) => {
            const key = String(log[field]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    buildTimeline(logs) {
        const timeline = {};
        logs.forEach((log) => {
            const date = log.created_at.toISOString().split('T')[0];
            timeline[date] = (timeline[date] || 0) + 1;
        });
        return Object.entries(timeline)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map