export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export interface PaymentInitializationResult {
    transactionId: string;
    checkoutUrl: string;
    reference: string;
    currency: string;
    amount: number;
    metadata?: any;
}

export interface PayoutExecutionResult {
    payoutId: string;
    status: PaymentStatus;
    providerReference: string;
    rawResponse?: any;
}

export interface PaymentAdapter {
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
