import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    initializeChapa(data: any): Promise<any>;
    verifyChapa(txRef: string): Promise<any>;
    initializeTelebirr(data: any): Promise<{
        success: boolean;
        message: string;
        checkoutUrl: string;
    }>;
    initializeBibit(data: any): Promise<{
        success: boolean;
        message: string;
        checkoutUrl: string;
    }>;
}
