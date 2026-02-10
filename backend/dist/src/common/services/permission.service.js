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
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionService = class PermissionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async hasPermissions(userId, requiredPermissions) {
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
        if (user.role === 'super_admin') {
            return true;
        }
        const hasExplicitPermissions = requiredPermissions.every((permission) => user.permissions.includes(permission));
        if (hasExplicitPermissions) {
            return true;
        }
        if (user.permission_groups.length > 0) {
            const groupPermissions = await this.getGroupPermissions(user.permission_groups);
            return requiredPermissions.every((permission) => groupPermissions.includes(permission));
        }
        return false;
    }
    async hasAnyPermission(userId, permissions) {
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
        if (user.role === 'super_admin') {
            return true;
        }
        const hasAnyExplicit = permissions.some((permission) => user.permissions.includes(permission));
        if (hasAnyExplicit) {
            return true;
        }
        if (user.permission_groups.length > 0) {
            const groupPermissions = await this.getGroupPermissions(user.permission_groups);
            return permissions.some((permission) => groupPermissions.includes(permission));
        }
        return false;
    }
    async getUserPermissions(userId) {
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
        if (user.role === 'super_admin') {
            return ['*.*'];
        }
        const explicitPermissions = user.permissions;
        const groupPermissions = await this.getGroupPermissions(user.permission_groups);
        return [...new Set([...explicitPermissions, ...groupPermissions])];
    }
    async getGroupPermissions(groupNames) {
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
        const permissions = groups.flatMap((group) => group.permissions.map((p) => p.name));
        return [...new Set(permissions)];
    }
    async grantPermission(userId, permission) {
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
    async revokePermission(userId, permission) {
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
    async addToGroup(userId, groupName) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permission_groups: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
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
    async removeFromGroup(userId, groupName) {
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
    async createPermission(data) {
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
    async createPermissionGroup(data) {
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
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }
    async getAllPermissionGroups() {
        return this.prisma.permissionGroup.findMany({
            include: {
                permissions: true,
            },
            orderBy: { name: 'asc' },
        });
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionService);
//# sourceMappingURL=permission.service.js.map