import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ensure this path is correct, usually src/auth/guards/jwt-auth.guard.ts

@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('initialize')
    async initializePayment(@Body() body: any) {
        // Extract provider from body if present, else use default via service logic
        // Generic initialization
        const provider = body.provider; // 'chapa', 'mock', etc.
        const adapter = this.paymentService.getAdapter(provider);

        return adapter.initializePayment({
            amount: body.amount,
            currency: body.currency,
            email: body.email,
            reference: body.reference || `tx-${Date.now()}`,
            callbackUrl: body.callbackUrl,
            metadata: body.metadata,
            phoneNumber: body.phoneNumber
        });
    }

    @Get('verify/:reference')
    async verifyPayment(@Param('reference') reference: string, @Query('provider') provider?: string) {
        const adapter = this.paymentService.getAdapter(provider);
        return adapter.verifyPayment(reference);
    }

    // Legacy support for specific endpoints if needed, mapping to new logic
    @Post('chapa/initialize')
    async initializeChapa(@Body() body: any) {
        return this.paymentService.getAdapter('chapa').initializePayment({
            amount: body.amount,
            currency: body.currency || 'ETB',
            email: body.email || body.buyerEmail, // Mapping field names
            reference: body.tx_ref || `tx-${Date.now()}`,
            callbackUrl: body.callback_url,
            phoneNumber: body.phone_number || body.buyerPhone,
            metadata: body
        });
    }

    @Get('chapa/verify/:txRef')
    async verifyChapa(@Param('txRef') txRef: string) {
        return this.paymentService.getAdapter('chapa').verifyPayment(txRef);
    }
}
