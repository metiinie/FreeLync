import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';
import { CommissionService } from './commission.service';
import { LedgerService } from './ledger.service';
import { Transaction, CommissionRecord, SellerBalance, LedgerEntry, RefundRecord, PayoutRequest } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
interface AdminContext {
    userId: string;
    role: string;
}
export declare class FinancialOrchestrationService {
    private readonly prisma;
    private readonly balanceService;
    private readonly commissionService;
    private readonly ledgerService;
    private readonly logger;
    constructor(prisma: PrismaService, balanceService: BalanceService, commissionService: CommissionService, ledgerService: LedgerService);
    releaseEscrowToSeller(params: {
        transactionId: string;
        adminContext: AdminContext;
        idempotencyKey: string;
    }): Promise<{
        transaction: Transaction;
        commissionRecord: CommissionRecord;
        sellerBalance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
    processRefund(params: {
        transactionId: string;
        amount: Decimal;
        reason: string;
        reversePlatformFee: boolean;
        initiatedById: string;
        idempotencyKey: string;
    }): Promise<{
        refundRecord: RefundRecord;
        sellerBalance?: SellerBalance;
        ledgerEntry?: LedgerEntry;
    }>;
    completePayout(params: {
        payoutRequestId: string;
        providerPayoutId: string;
        providerResponse: Record<string, any>;
        idempotencyKey: string;
    }): Promise<{
        payoutRequest: PayoutRequest;
        sellerBalance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
}
export {};
