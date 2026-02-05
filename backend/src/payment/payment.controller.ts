import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('chapa/initialize')
    async initializeChapa(@Body() data: any) {
        return this.paymentService.initializeChapaPayment(data);
    }

    @Get('chapa/verify/:txRef')
    async verifyChapa(@Param('txRef') txRef: string) {
        return this.paymentService.verifyChapaPayment(txRef);
    }

    @Post('telebirr/initialize')
    async initializeTelebirr(@Body() data: any) {
        return this.paymentService.initializeTelebirrPayment(data);
    }

    @Post('bibit/initialize')
    async initializeBibit(@Body() data: any) {
        return this.paymentService.initializeBibitPayment(data);
    }
}
