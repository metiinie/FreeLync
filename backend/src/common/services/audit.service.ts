import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLog, AuditStatus, RiskLevel, UserRole } from '@prisma/client';

export interface AdminContextType {
    userId: string;
    sessionId: string;
    role: UserRole;
    permissions: string[];
    permissionGroups: string[];
    ip: string;
    userAgent?: string;
}

export interface AuditLogInput {
    performedBy: AdminContextType;
    action: string;
    resourceType: string;
    resourceId: string;
    reason?: string;
    justification?: string;
    beforeState?: any;
    afterState?: any;
    changes?: any;
    riskLevel: RiskLevel;
    status: AuditStatus;
    errorMessage?: string;
    metadata?: any;
    requestId?: string;
}

export interface AuditFilters {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    riskLevel?: RiskLevel;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface AdminActivityReport {
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByRisk: Record<string, number>;
    successRate: number;
    timeline: Array<{ date: string; count: number }>;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log an admin action to the audit trail
     */
    async log(data: AuditLogInput): Promise<AuditLog> {
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

    /**
     * Get audit trail with filters
     */
    async getAuditTrail(filters: AuditFilters): Promise<{
        data: AuditLog[];
        total: number;
    }> {
        const where: any = {};

        if (filters.userId) where.performed_by_id = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.resourceType) where.resource_type = filters.resourceType;
        if (filters.resourceId) where.resource_id = filters.resourceId;
        if (filters.riskLevel) where.risk_level = filters.riskLevel;
        if (filters.status) where.status = filters.status;

        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate) where.created_at.gte = filters.startDate;
            if (filters.endDate) where.created_at.lte = filters.endDate;
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

    /**
     * Get complete history of a specific resource
     */
    async getResourceHistory(
        resourceType: string,
        resourceId: string,
    ): Promise<AuditLog[]> {
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

    /**
     * Get admin activity report
     */
    async getAdminActivity(
        adminId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<AdminActivityReport> {
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

    /**
     * Get high-risk actions that require review
     */
    async getHighRiskActions(limit = 50): Promise<AuditLog[]> {
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

    /**
     * Get failed actions for security monitoring
     */
    async getFailedActions(limit = 50): Promise<AuditLog[]> {
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

    /**
     * Archive old audit logs for compliance
     */
    async archiveOldLogs(beforeDate: Date): Promise<number> {
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

    /**
     * Helper: Group logs by a field
     */
    private groupBy(logs: AuditLog[], field: keyof AuditLog): Record<string, number> {
        return logs.reduce((acc, log) => {
            const key = String(log[field]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Helper: Build timeline of actions
     */
    private buildTimeline(logs: AuditLog[]): Array<{ date: string; count: number }> {
        const timeline: Record<string, number> = {};

        logs.forEach((log) => {
            const date = log.created_at.toISOString().split('T')[0];
            timeline[date] = (timeline[date] || 0) + 1;
        });

        return Object.entries(timeline)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
