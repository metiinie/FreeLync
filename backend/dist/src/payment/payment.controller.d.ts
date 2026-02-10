import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    initializePayment(body: any): Promise<import("./interfaces/payment-adapter.interface").PaymentInitializationResult>;
    verifyPayment(reference: string, provider?: string): Promise<{
        status: import("./interfaces/payment-adapter.interface").PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }>;
    initializeChapa(body: any): Promise<import("./interfaces/payment-adapter.interface").PaymentInitializationResult>;
    verifyChapa(txRef: string): Promise<{
        status: import("./interfaces/payment-adapter.interface").PaymentStatus;
        gatewayReference: string;
        amount?: number;
        currency?: string;
    }>;
}
