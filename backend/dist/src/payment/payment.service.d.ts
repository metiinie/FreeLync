import { ConfigService } from '@nestjs/config';
import { PaymentAdapter } from './interfaces/payment-adapter.interface';
export declare class PaymentService {
    private configService;
    private readonly logger;
    private adapters;
    private defaultProvider;
    constructor(configService: ConfigService);
    getAdapter(providerName?: string): PaymentAdapter;
    initializePayment(params: Parameters<PaymentAdapter['initializePayment']>[0]): Promise<import("./interfaces/payment-adapter.interface").PaymentInitializationResult>;
    verifyPayment(reference: string): Promise<{
        status: import("./interfaces/payment-adapter.interface").PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }>;
    executePayout(params: Parameters<PaymentAdapter['executePayout']>[0]): Promise<import("./interfaces/payment-adapter.interface").PayoutExecutionResult>;
}
