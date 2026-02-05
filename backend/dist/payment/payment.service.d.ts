import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class PaymentService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    initializeChapaPayment(data: any): Promise<any>;
    verifyChapaPayment(txRef: string): Promise<any>;
    initializeTelebirrPayment(data: any): Promise<{
        success: boolean;
        message: string;
        checkoutUrl: string;
    }>;
    initializeBibitPayment(data: any): Promise<{
        success: boolean;
        message: string;
        checkoutUrl: string;
    }>;
}
