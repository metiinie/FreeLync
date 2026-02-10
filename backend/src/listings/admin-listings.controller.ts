import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Audited } from '../common/decorators/audited.decorator';
import { AdminContext } from '../common/decorators/admin-context.decorator';
import type { AdminContextType } from '../common/middleware/admin-identity.middleware';

/**
 * Admin Listings Controller with Phase 0 Control Layer
 */
@Controller('admin/listings')
// Note: We might need to ensure AdminIdentityMiddleware runs for this route.
// It is applied in AppModule to 'admin/*'.
// However, PermissionGuard checks for 'adminContext' which is attached by AdminIdentityMiddleware.
// It DOES NOT use JwtAuthGuard unless we want to support dual auth, but AdminIdentityMiddleware handles session validation.
// If we use JwtAuthGuard, it validates the JWT but doesn't attach adminContext from AdminSession table.
// So we should rely on AdminIdentityMiddleware for identity.
// But we can keep JwtAuthGuard if the token is ALSO a valid JWT (which it is not, it's a session token).
// So REMOVE JwtAuthGuard if using Admin Session tokens.
// However, if we want to support existing JWTs for now...
// The plan is to use AdminSessionService.
// So we should NOT use JwtAuthGuard here if we strictly follow the new architecture.
// But let's check PermissionGuard implementation.
// It checks 'context.switchToHttp().getRequest().adminContext'.
// This is set by AdminIdentityMiddleware.
// So we just need PermissionGuard.
@UseGuards(PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class AdminListingsController {
    constructor(private listingsService: ListingsService) { }

    @Get()
    @RequirePermissions('listings.view')
    async getAllListings(
        @AdminContext() admin: AdminContextType,
        @Query() query: any
    ) {
        return this.listingsService.getAllListingsForAdmin(admin.userId, query);
    }

    @Patch(':id/approve')
    @RequirePermissions('listings.approve')
    @Audited({
        action: 'listing.approve',
        resourceType: 'Listing',
        riskLevel: 'medium',
        captureBeforeState: true,
        captureAfterState: true,
    })
    async approveListing(
        @Param('id') id: string,
        @Body() dto: { reason?: string; notes?: string },
        @AdminContext() admin: AdminContextType,
    ) {
        if (!dto.reason || dto.reason.length < 10) {
            throw new BadRequestException(
                'Reason required for approval (min 10 characters)',
            );
        }

        return this.listingsService.approveListing(id, {
            approvedBy: admin.userId,
            reason: dto.reason,
            notes: dto.notes,
        });
    }

    @Patch(':id/reject')
    @RequirePermissions('listings.reject')
    @Audited({
        action: 'listing.reject',
        resourceType: 'Listing',
        riskLevel: 'medium',
        captureBeforeState: true,
        captureAfterState: true,
    })
    async rejectListing(
        @Param('id') id: string,
        @Body() dto: { reason: string },
        @AdminContext() admin: AdminContextType,
    ) {
        if (!dto.reason || dto.reason.length < 20) {
            throw new BadRequestException(
                'Detailed reason required for rejection (min 20 characters)',
            );
        }

        return this.listingsService.rejectListing(id, {
            rejectedBy: admin.userId,
            reason: dto.reason,
        });
    }

    @Delete(':id')
    @RequirePermissions('listings.delete')
    @Audited({
        action: 'listing.delete',
        resourceType: 'Listing',
        riskLevel: 'high',
        captureBeforeState: true, // Capture what was deleted
    })
    async deleteListing(
        @Param('id') id: string,
        @Body() dto: { reason: string },
        @AdminContext() admin: AdminContextType,
    ) {
        if (!dto.reason || dto.reason.length < 30) {
            throw new BadRequestException(
                'Detailed justification required for deletion (min 30 characters)',
            );
        }

        return this.listingsService.deleteListingAsAdmin(id, {
            deletedBy: admin.userId,
            reason: dto.reason,
        });
    }
}
