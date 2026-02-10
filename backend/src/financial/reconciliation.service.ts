import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { BalanceService } from './balance.service';
import { SellerBalance, LedgerEntryType, PayoutRequestStatus } from '@prisma/client';
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
        ledgerPendingDetails: Decimal; // Sum of HOLDs - RELEASEs - DEBIT(payout)
        status: 'MATCH' | 'MISMATCH';
    };
}

@Injectable()
export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ledgerService: LedgerService,
        private readonly balanceService: BalanceService,
    ) { }

    /**
     * Run full reconciliation for a specific seller balance.
     * Compares Snapshot (SellerBalance) vs Truth (Ledger History).
     */
    async reconcileBalance(sellerBalanceId: string): Promise<ReconciliationReport> {
        const balance = await this.prisma.sellerBalance.findUniqueOrThrow({
            where: { id: sellerBalanceId },
        });

        // 1. Reconstruct Total Balance from Ledger Events
        // Invariant: Total = Credits - Debits (HOLD/RELEASE don't affect Net Equity)
        const ledgerCalc = await this.ledgerService.calculateBalanceFromLedger(sellerBalanceId);

        // 2. Snapshot Total
        const snapshotTotal = balance.available_balance.add(balance.pending_balance);

        // 3. Compare
        const totalDiscrepancy = snapshotTotal.sub(ledgerCalc.balance);

        // 4. Verify Pending/Payout Consistency (Invariant 4)
        // Pending Balance should equal Sum(Active Holds)
        // Active Hold = HOLD entry without matching RELEASE or DEBIT(payout)
        // This is expensive to calculate perfectly without a "Hold" entity, 
        // but we can approximate via: Total PENDING holds vs PayoutRequests.
        const pendingPayouts = await this.prisma.payoutRequest.findMany({
            where: { seller_balance_id: sellerBalanceId, status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } }
        });

        const calculatedPending = pendingPayouts.reduce((sum, p) => sum.add(p.amount), new Decimal(0));

        const pendingDiscrepancy = balance.pending_balance.sub(calculatedPending);

        const report: ReconciliationReport = {
            balanceId: sellerBalanceId,
            timestamp: new Date(),
            status: totalDiscrepancy.equals(0) && pendingDiscrepancy.equals(0) ? 'MATCH' : 'MISMATCH',
            snapshot: {
                available: balance.available_balance,
                pending: balance.pending_balance,
                total: snapshotTotal,
            },
            ledger: {
                credits: ledgerCalc.credits,
                debits: ledgerCalc.debits,
                calculatedTotal: ledgerCalc.balance, // Truth
            },
            discrepancy: totalDiscrepancy,
            payouts: {
                totalPending: calculatedPending,
                ledgerPendingDetails: balance.pending_balance,
                status: pendingDiscrepancy.equals(0) ? 'MATCH' : 'MISMATCH'
            }
        };

        if (report.status === 'MISMATCH') {
            this.logger.error(`CRITICAL: Reconciliation Mismatch for ${sellerBalanceId}`, report);
            // Can trigger alert/email here
        } else {
            this.logger.log(`Reconciliation Passed for ${sellerBalanceId}`);
        }

        return report;
    }

    /**
     * DEBUG ONLY: Deliberately corrupt a balance snapshot to verify detection.
     * DO NOT RUN IN PRODUCTION.
     */
    async simulateCorruption(sellerBalanceId: string, amount: number) {
        this.logger.warn(`SIMULATING CORRUPTION on ${sellerBalanceId} by ${amount}`);
        // Direct raw SQL update to bypass any application logic/invariants
        await this.prisma.$executeRaw`
        UPDATE "seller_balances" 
        SET "available_balance" = "available_balance" + ${amount} 
        WHERE "id" = ${sellerBalanceId}
     `;
        return this.reconcileBalance(sellerBalanceId);
    }

    async runSystemWideReconciliation() {
        this.logger.log("Starting System-Wide Reconciliation...");
        const balances = await this.prisma.sellerBalance.findMany({ select: { id: true } });

        const results: ReconciliationReport[] = [];
        for (const b of balances) {
            try {
                results.push(await this.reconcileBalance(b.id));
            } catch (e) {
                this.logger.error(`Failed to reconcile ${b.id}`, e);
            }
        }

        const failures = results.filter(r => r.status === 'MISMATCH');
        this.logger.log(`System Reconciliation Complete. Checked: ${results.length}. Failures: ${failures.length}`);
        return { total: results.length, failures };
    }
}
