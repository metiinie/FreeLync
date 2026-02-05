import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inquiries')
export class InquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) { }

    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.inquiriesService.create(data, req.user.userId);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.inquiriesService.findAll(req.user.userId);
    }
}
