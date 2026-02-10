import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    @Post()
    create(@Body() dto: CreateDisputeDto, @Req() req: any) {
        return this.disputesService.create(dto, req.user.id);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.disputesService.findAll(req.user.id, req.user.role);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: any) {
        return this.disputesService.findOne(id, req.user.id, req.user.role);
    }

    @Post(':id/evidence')
    addEvidence(@Param('id') id: string, @Body() dto: AddEvidenceDto, @Req() req: any) {
        return this.disputesService.addEvidence(id, dto, req.user.id);
    }

    @Post(':id/messages')
    addMessage(@Param('id') id: string, @Body() dto: AddMessageDto, @Req() req: any) {
        return this.disputesService.addMessage(id, dto, req.user.id, false);
    }
}
