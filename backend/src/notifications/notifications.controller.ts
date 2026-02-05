import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.notificationService.findAll(req.user.userId);
    }

    // Usually notifications are created by system events, but this endpoint might be useful for testing or admin messages
    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.notificationService.create(data, req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.notificationService.markAsRead(id, req.user.userId);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.notificationService.delete(id, req.user.userId);
    }
}
