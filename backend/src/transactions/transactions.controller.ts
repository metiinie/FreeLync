import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.transactionsService.findAll(req.user.userId, req.user.role);
    }

    @Get('stats')
    getStats() {
        return this.transactionsService.getStats();
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.transactionsService.findOne(id, req.user.userId, req.user.role);
    }

    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.transactionsService.create(data, req.user.userId);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: any) {
        // Only admins or automated systems should call this in production
        return this.transactionsService.updateStatus(id, status);
    }
}
