import { PrismaService } from '../../prisma/prisma.service';
export declare class PermissionService {
    private prisma;
    constructor(prisma: PrismaService);
    hasPermissions(userId: string, requiredPermissions: string[]): Promise<boolean>;
    hasAnyPermission(userId: string, permissions: string[]): Promise<boolean>;
    getUserPermissions(userId: string): Promise<string[]>;
    private getGroupPermissions;
    grantPermission(userId: string, permission: string): Promise<void>;
    revokePermission(userId: string, permission: string): Promise<void>;
    addToGroup(userId: string, groupName: string): Promise<void>;
    removeFromGroup(userId: string, groupName: string): Promise<void>;
    createPermission(data: {
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
        riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<{
        id: string;
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
        risk_level: import(".prisma/client").$Enums.RiskLevel;
        created_at: Date;
        updated_at: Date;
    }>;
    createPermissionGroup(data: {
        name: string;
        description: string;
        permissions: string[];
    }): Promise<{
        id: string;
        name: string;
        description: string;
        created_at: Date;
        updated_at: Date;
    }>;
    getAllPermissions(): Promise<{
        id: string;
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
        risk_level: import(".prisma/client").$Enums.RiskLevel;
        created_at: Date;
        updated_at: Date;
    }[]>;
    getAllPermissionGroups(): Promise<({
        permissions: {
            id: string;
            name: string;
            resource: string;
            action: string;
            description: string;
            category: string;
            risk_level: import(".prisma/client").$Enums.RiskLevel;
            created_at: Date;
            updated_at: Date;
        }[];
    } & {
        id: string;
        name: string;
        description: string;
        created_at: Date;
        updated_at: Date;
    })[]>;
}
