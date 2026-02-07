import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    findAll(@Query() query: any, @Request() req: any) {
        // We temporarily use req.user if available. 
        // To make req.user available, we might need an optional JWT guard or just manually check the header.
        // For now, let's assume we use JwtAuthGuard if we want admin features, 
        // but for public we can have a separate 'admin-list' or just handle it in service if user is passed.
        return this.listingsService.findAll(query, req.user);
    }

    @Get('stats')
    getStats() {
        return this.listingsService.getStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.listingsService.create(data, req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string; notes?: string }
    ) {
        return this.listingsService.updateStatus(id, body.status, body.notes);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        const isAdmin = req.user.role === 'admin';
        return this.listingsService.update(id, data, req.user.userId, isAdmin);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        const isAdmin = req.user.role === 'admin';
        return this.listingsService.remove(id, req.user.userId, isAdmin);
    }
}
