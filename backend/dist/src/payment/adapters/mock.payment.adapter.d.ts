import { PaymentAdapter, PaymentInitializationResult, PaymentStatus, PayoutExecutionResult } from '../interfaces/payment-adapter.interface';
export declare class MockPaymentAdapter implements PaymentAdapter {
    private readonly logger;
    initializePayment(params: {
        amount: number;
        currency: string;
        email: string;
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
