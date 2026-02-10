import { ConfigService } from '@nestjs/config';
import { PaymentAdapter, PaymentInitializationResult, PaymentStatus, PayoutExecutionResult } from '../interfaces/payment-adapter.interface';
export declare class ChapaPaymentAdapter implements PaymentAdapter {
    private configService;
    private readonly logger;
    private readonly chapaSecretKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    initializePayment(params: {
        amount: number;
        currency: string;
        email: string;
        phoneNumber?: string;
        callbackUrl: string;
        reference: string;
        metadata?: any;
    }): Promise<PaymentInitializationResult>;
    verifyPayment(reference: string): Promise<{
        status: PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }>;
    executePayout(params: {
        amount: number;
        currency: string;
        recipientDetails: any;
        reference: string;
        metadata?: any;
    }): Promise<PayoutExecutionResult>;
}
