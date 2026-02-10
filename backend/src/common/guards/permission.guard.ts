import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionService: PermissionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<string[]>(
            'permissions',
            context.getHandler(),
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const adminContext = request.adminContext;

        if (!adminContext) {
            throw new ForbiddenException('Admin authentication required');
        }

        // Check if user has required permissions
        const hasPermissions = await this.permissionService.hasPermissions(
            adminContext.userId,
            requiredPermissions,
        );

        if (!hasPermissions) {
            throw new ForbiddenException(
                `Missing required permissions: ${requiredPermissions.join(', ')}`,
            );
        }

        return true;
    }
}
