import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminContextType } from '../middleware/admin-identity.middleware';

/**
 * Decorator to inject admin context into controller methods
 * 
 * @example
 * async approveListing(
 *   @AdminContext() admin: AdminContextType,
 * ) {
 *   console.log(admin.userId, admin.role, admin.permissions);
 * }
 */
export const AdminContext = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AdminContextType | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.adminContext;
    },
);
