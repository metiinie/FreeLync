import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVerificationRequestDto } from './dto/create-request.dto';
import { SubmitDocumentDto } from './dto/submit-document.dto';

@Controller('verifications')
@UseGuards(JwtAuthGuard)
export class VerificationsController {
    constructor(private readonly verificationsService: VerificationsService) { }

    @Post('requests')
    createRequest(@Req() req, @Body() dto: CreateVerificationRequestDto) {
        return this.verificationsService.createRequest(req.user.id, dto);
    }

    @Get('requests')
    getMyRequests(@Req() req) {
        return this.verificationsService.getMyRequests(req.user.id);
    }

    @Post('requests/:id/documents')
    submitDocument(
        @Req() req,
        @Param('id') requestId: string,
        @Body() dto: SubmitDocumentDto,
    ) {
        return this.verificationsService.submitDocument(req.user.id, requestId, dto);
    }

    @Get('document-types')
    getDocumentTypes() {
        return this.verificationsService.getDocumentTypes();
    }
}
