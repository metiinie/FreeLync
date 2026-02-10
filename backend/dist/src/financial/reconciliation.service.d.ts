import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { BalanceService } from './balance.service';
import { Decimal } from '@prisma/client/runtime/library';
export interface ReconciliationReport {
    balanceId: string;
    timestamp: Date;
    status: 'MATCH' | 'MISMATCH';
    snapshot: {
        available: Decimal;
        pending: Decimal;
        total: Decimal;
    };
    ledger: {
        credits: Decimal;
        debits: Decimal;
        calculatedTotal: Decimal;
    };
    discrepancy: Decimal;
    payouts: {
        totalPending: Decimal;
        ledgerPendingDetails: Decimal;
        status: 'MATCH' | 'MISMATCH';
    };
}
export declare class ReconciliationService {
    private readonly prisma;
    private readonly ledgerService;
    private readonly balanceService;
    private readonly logger;
    constructor(prisma: PrismaService, ledgerService: LedgerService, balanceService: BalanceService);
    reconcileBalance(sellerBalanceId: string): Promise<ReconciliationReport>;
    simulateCorruption(sellerBalanceId: string, amount: number): Promise<ReconciliationReport>;
    runSystemWideReconciliation(): Promise<{
        total: number;
        failures: ReconciliationReport[];
    }>;
}
