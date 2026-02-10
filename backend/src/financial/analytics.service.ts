import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinancialAnalyticsService {
    private readonly logger = new Logger(FinancialAnalyticsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculate Total Platform Revenue from Commission Records.
     * Traceable directly to CommissionRecord table (immutable).
     */
    async getTotalRevenue(currency = 'ETB'): Promise<Decimal> {
        const aggregate = await this.prisma.commissionRecord.aggregate({
            _sum: { platform_fee: true },
            where: { currency }, // Filter by currency
        });
        return aggregate._sum?.platform_fee || new Decimal(0);
    }

    /**
     * Calculate Total Outstanding Liabilities (What we owe sellers).
     * Sum of all positive Seller Balances (Available + Pending).
     * Verify against Ledger Sum of Credits - Debits globally? 
     * Ledger is authoritative source.
     */
    async getTotalLiabilities(currency = 'ETB'): Promise<Decimal> {
        // Correct way: Sum all credits - sum all debits from ledger.
        // If ledger has multiple currencies, filter by currency.
        // Assuming single currency ledger for now or explicit field.
        const aggregate = await this.prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: {
                currency,
                type: { in: ['CREDIT', 'DEBIT'] }
            }
        });

        // We can't simply sum amount because DEBIT reduces liability. 
        // Aggregate queries don't do conditional sum easily without raw SQL.
        // Use raw query for performance & correctness.

        const result = await this.prisma.$queryRaw<{ liabilities: Decimal }[]>`
      SELECT 
        SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END) as liabilities
      FROM "ledger_entries"
      WHERE currency = ${currency}
      AND type IN ('CREDIT', 'DEBIT')
    `;

        return result[0]?.liabilities || new Decimal(0);
    }

    /**
     * Calculate Total Payout Volume (processed).
     * Traceable to PayoutRequests with status COMPLETED.
     */
    async getTotalPayouts(currency = 'ETB'): Promise<Decimal> {
        const aggregate = await this.prisma.payoutRequest.aggregate({
            _sum: { amount: true },
            where: {
                currency,
                status: 'COMPLETED'
            }
        });
        return aggregate._sum?.amount || new Decimal(0);
    }

    /**
     * Get recent financial velocity (transactions per hour).
     */
    async getTransactionVelocity(hours = 24): Promise<number> {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.prisma.transaction.count({
            where: { created_at: { gte: since } }
        });
    }
}
