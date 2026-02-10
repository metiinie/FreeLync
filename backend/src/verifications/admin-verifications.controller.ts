import { Controller, Post, Get, Body, Param, UseGuards, Query, UseInterceptors, Patch } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { PermissionGuard } from '../common/guards/permission.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AdminContext } from '../common/decorators/admin-context.decorator';
import type { AdminContextType } from '../common/middleware/admin-identity.middleware';
import { ReviewRequestDto } from './dto/review-request.dto';
import { VerificationDocumentStatus } from '@prisma/client';

@Controller('admin/verifications')
@UseGuards(PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class AdminVerificationsController {
    constructor(private readonly verificationsService: VerificationsService) { }

    @Get('requests')
    @RequirePermissions('verifications.view')
    findAll(@Query() filters: any) {
        return this.verificationsService.findAllForAdmin(filters);
    }

    @Patch('requests/:id/review')
    @RequirePermissions('verifications.review')
    reviewRequest(
        @Param('id') id: string,
        @Body() dto: ReviewRequestDto,
        @AdminContext() adminContext: AdminContextType,
    ) {
        return this.verificationsService.reviewRequest(id, adminContext.userId, dto, adminContext);
    }

    @Patch('documents/:id/status')
    @RequirePermissions('verifications.review')
    reviewDocument(
        @Param('id') id: string,
        @Body('status') status: VerificationDocumentStatus,
        @Body('reason') reason: string,
        @AdminContext() adminContext: AdminContextType,
    ) {
        return this.verificationsService.reviewDocument(id, status, adminContext.userId, reason);
    }
}
