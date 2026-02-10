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
    timeline: Array<{
        date: string;
        count: number;
    }>;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: AuditLogInput): Promise<AuditLog>;
    getAuditTrail(filters: AuditFilters): Promise<{
        data: AuditLog[];
        total: number;
    }>;
    getResourceHistory(resourceType: string, resourceId: string): Promise<AuditLog[]>;
    getAdminActivity(adminId: string, startDate: Date, endDate: Date): Promise<AdminActivityReport>;
    getHighRiskActions(limit?: number): Promise<AuditLog[]>;
    getFailedActions(limit?: number): Promise<AuditLog[]>;
    archiveOldLogs(beforeDate: Date): Promise<number>;
    private groupBy;
    private buildTimeline;
}
