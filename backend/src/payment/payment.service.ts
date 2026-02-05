import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) { }

    async initializeChapaPayment(data: any) {
        const CHAPA_SECRET_KEY = this.configService.get<string>('CHAPA_SECRET_KEY');
        const response = await axios.post(
            'https://api.chapa.co/v1/transaction/initialize',
            {
                amount: data.amount,
                currency: data.currency,
                email: data.buyerEmail,
                first_name: data.buyerName,
                phone_number: data.buyerPhone,
                tx_ref: `tx-${Date.now()}`,
                callback_url: 'https://example.com/callback', // Replace with actual callback
                return_url: 'https://example.com/return',
                customization: {
                    title: 'Payment',
                    description: 'Payment for validation',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                },
            },
        );

        return response.data;
    }

    async verifyChapaPayment(txRef: string) {
        const CHAPA_SECRET_KEY = this.configService.get<string>('CHAPA_SECRET_KEY');
        const response = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${txRef}`,
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                },
            },
        );
        return response.data;
    }

    // Placeholder for Telebirr and Bibit as they require specific SDKs or complex signature logic
    async initializeTelebirrPayment(data: any) {
        // Implement Telebirr logic here
        return { success: true, message: "Telebirr initialized (mock)", checkoutUrl: "http://telebirr.mock" };
    }

    async initializeBibitPayment(data: any) {
        // Implement Bibit logic here
        return { success: true, message: "Bibit initialized (mock)", checkoutUrl: "http://bibit.mock" };
    }
}
