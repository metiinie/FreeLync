import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify required permissions for an endpoint
 * 
 * @example
 * @RequirePermissions('listings.approve', 'listings.update')
 * async approveListing() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
    SetMetadata('permissions', permissions);
