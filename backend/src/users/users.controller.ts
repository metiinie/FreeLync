import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @Get()
    async findAll(@Query() query: any) {
        const { page = 1, limit = 10, search, role, verified, is_active } = query;
        return this.usersService.findAll({
            page: Number(page),
            limit: Number(limit),
            search,
            role,
            verified: verified === 'true',
            is_active: is_active === 'true',
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findOneById(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin)
    @Get('stats')
    getStats() {
        return this.usersService.getStats();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOneById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        const isAdmin = req.user.role === 'admin';
        // Only allow user to update themselves or admin to update anyone
        if (req.user.userId !== id && !isAdmin) {
            throw new Error('Unauthorized');
        }
        return this.usersService.update(id, data);
    }
}
