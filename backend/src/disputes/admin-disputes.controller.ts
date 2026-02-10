import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    Query,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { AdminContext } from '../common/decorators/admin-context.decorator';
import type { AdminContextType } from '../common/middleware/admin-identity.middleware';
import type { AddMessageDto } from './dto/add-message.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PermissionGuard } from '../common/guards/permission.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Audited } from '../common/decorators/audited.decorator';

@Controller('admin/disputes')
@UseGuards(PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class AdminDisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    @Get()
    @RequirePermissions('disputes.view')
    async findAll(@AdminContext() admin: AdminContextType) {
        return this.disputesService.findAll(admin.userId, admin.role);
    }

    @Get(':id')
    @RequirePermissions('disputes.view')
    async findOne(@Param('id') id: string, @AdminContext() admin: AdminContextType) {
        return this.disputesService.findOne(id, admin.userId, admin.role);
    }

    @Post(':id/assign')
    @RequirePermissions('disputes.manage')
    @Audited({
        action: 'disputes.assign',
        resourceType: 'Dispute',
        riskLevel: 'low',
        captureAfterState: true,
    })
    async assignMember(
        @Param('id') id: string,
        @AdminContext() admin: AdminContextType,
    ) {
        return this.disputesService.assignMember(id, admin.userId, admin);
    }

    @Patch(':id/resolve')
    @RequirePermissions('disputes.resolve')
    @Audited({
        action: 'disputes.resolve',
        resourceType: 'Dispute',
        riskLevel: 'critical',
        captureBeforeState: true,
        captureAfterState: true,
    })
    async resolve(
        @Param('id') id: string,
        @Body() dto: ResolveDisputeDto,
        @AdminContext() admin: AdminContextType,
    ) {
        return this.disputesService.resolve(id, dto, admin);
    }

    @Post(':id/messages')
    @RequirePermissions('disputes.manage')
    async addMessage(
        @Param('id') id: string,
        @Body() dto: AddMessageDto,
        @AdminContext() admin: AdminContextType,
    ) {
        return this.disputesService.addMessage(id, dto, admin.userId, true);
    }
}
