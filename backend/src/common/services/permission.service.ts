import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Check if a user has specific permissions
     */
    async hasPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                permissions: true,
                permission_groups: true,
            },
        });

        if (!user) {
            return false;
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return true;
        }

        // Check explicit permissions
        const hasExplicitPermissions = requiredPermissions.every((permission) =>
            user.permissions.includes(permission),
        );

        if (hasExplicitPermissions) {
            return true;
        }

        // Check permissions from groups
        if (user.permission_groups.length > 0) {
            const groupPermissions = await this.getGroupPermissions(user.permission_groups);
            return requiredPermissions.every((permission) =>
                groupPermissions.includes(permission),
            );
        }

        return false;
    }

    /**
     * Check if a user has any of the specified permissions
     */
    async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                permissions: true,
                permission_groups: true,
            },
        });

        if (!user) {
            return false;
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return true;
        }

        // Check explicit permissions
        const hasAnyExplicit = permissions.some((permission) =>
            user.permissions.includes(permission),
        );

        if (hasAnyExplicit) {
            return true;
        }

        // Check permissions from groups
        if (user.permission_groups.length > 0) {
            const groupPermissions = await this.getGroupPermissions(user.permission_groups);
            return permissions.some((permission) => groupPermissions.includes(permission));
        }

        return false;
    }

    /**
     * Get all permissions for a user (explicit + from groups)
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                permissions: true,
                permission_groups: true,
            },
        });

        if (!user) {
            return [];
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return ['*.*']; // Wildcard for all permissions
        }

        const explicitPermissions = user.permissions;
        const groupPermissions = await this.getGroupPermissions(user.permission_groups);

        // Combine and deduplicate
        return [...new Set([...explicitPermissions, ...groupPermissions])];
    }

    /**
     * Get permissions from permission groups
     */
    private async getGroupPermissions(groupNames: string[]): Promise<string[]> {
        const groups = await this.prisma.permissionGroup.findMany({
            where: {
                name: {
                    in: groupNames,
                },
            },
            include: {
                permissions: true,
            },
        });

        const permissions = groups.flatMap((group) =>
            group.permissions.map((p) => p.name),
        );

        return [...new Set(permissions)];
    }

    /**
     * Grant permission to a user
     */
    async grantPermission(userId: string, permission: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.permissions.includes(permission)) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    permissions: {
                        push: permission,
                    },
                },
            });
        }
    }

    /**
     * Revoke permission from a user
     */
    async revokePermission(userId: string, permission: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                permissions: user.permissions.filter((p) => p !== permission),
            },
        });
    }

    /**
     * Add user to a permission group
     */
    async addToGroup(userId: string, groupName: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permission_groups: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Verify group exists
        const group = await this.prisma.permissionGroup.findUnique({
            where: { name: groupName },
        });

        if (!group) {
            throw new Error('Permission group not found');
        }

        if (!user.permission_groups.includes(groupName)) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    permission_groups: {
                        push: groupName,
                    },
                },
            });
        }
    }

    /**
     * Remove user from a permission group
     */
    async removeFromGroup(userId: string, groupName: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permission_groups: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                permission_groups: user.permission_groups.filter((g) => g !== groupName),
            },
        });
    }

    /**
     * Create a new permission
     */
    async createPermission(data: {
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
        riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }) {
        return this.prisma.permission.create({
            data: {
                name: data.name,
                resource: data.resource,
                action: data.action,
                description: data.description,
                category: data.category,
                risk_level: data.riskLevel || 'medium',
            },
        });
    }

    /**
     * Create a new permission group
     */
    async createPermissionGroup(data: {
        name: string;
        description: string;
        permissions: string[];
    }) {
        return this.prisma.permissionGroup.create({
            data: {
                name: data.name,
                description: data.description,
                permissions: {
                    connect: data.permissions.map((name) => ({ name })),
                },
            },
        });
    }

    /**
     * Get all permissions
     */
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }

    /**
     * Get all permission groups
     */
    async getAllPermissionGroups() {
        return this.prisma.permissionGroup.findMany({
            include: {
                permissions: true,
            },
            orderBy: { name: 'asc' },
        });
    }
}
