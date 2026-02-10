import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';
import { FinancialOrchestrationService } from './financial.orchestrator.service';
import { PaymentService } from '../payment/payment.service';
import { PayoutRequest } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
interface AdminContext {
    userId: string;
    role: string;
}
export declare class PayoutService {
    private readonly prisma;
    private readonly balanceService;
    private readonly financialOrchestration;
    private readonly paymentService;
    private readonly logger;
    constructor(prisma: PrismaService, balanceService: BalanceService, financialOrchestration: FinancialOrchestrationService, paymentService: PaymentService);
    requestPayout(params: {
        sellerId: string;
        amount: Decimal;
        paymentMethod: string;
        paymentDetails: Record<string, any>;
        idempotencyKey: string;
        metadata?: Record<string, any>;
    }): Promise<PayoutRequest>;
    approvePayout(params: {
        payoutRequestId: string;
        adminId: string;
        adminContext: AdminContext;
    }): Promise<PayoutRequest>;
    rejectPayout(params: {
        payoutRequestId: string;
        adminId: string;
        rejectionReason: string;
        adminContext: AdminContext;
    }): Promise<PayoutRequest>;
    processPayout(payoutRequestId: string): Promise<PayoutRequest>;
}
export {};
