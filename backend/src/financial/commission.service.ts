import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionRecord } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CommissionCalculation {
    grossAmount: Decimal;
    platformFee: Decimal;
    platformFeePercentage: Decimal;
    processorFee: Decimal;
    netAmount: Decimal;
    calculationMethod: string;
    calculationMetadata: Record<string, any>;
}

interface CommissionTier {
    min: number;
    max: number;
    rate: number;
}

interface VerificationResult {
    valid: boolean;
    expected: Decimal;
    actual: Decimal;
}

/**
 * CommissionService
 * 
 * Purpose: Calculate commissions deterministically
 * Invariants Enforced: 5
 * 
 * CRITICAL RULES:
 * - MUST be pure function (no side effects in calculation)
 * - MUST be deterministic (same input → same output)
 * - MUST store calculation method and metadata
 * - MUST verify on read
 * - NEVER use floating-point arithmetic (use Decimal)
 * - NEVER modify commission after creation
 */
@Injectable()
export class CommissionService {
    private readonly logger = new Logger(CommissionService.name);

    // Commission tiers (configurable via PlatformConfig in future)
    private readonly COMMISSION_TIERS: CommissionTier[] = [
        { min: 0, max: 10000, rate: 0.05 },      // 5% for 0-10,000 ETB
        { min: 10001, max: 50000, rate: 0.03 },  // 3% for 10,001-50,000 ETB
        { min: 50001, max: Infinity, rate: 0.02 } // 2% for 50,001+ ETB
    ];

    // Processor fees (configurable via PlatformConfig in future)
    private readonly PROCESSOR_FEE = {
        percentage: 0.025, // 2.5%
        fixed: 5           // 5 ETB
    };

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculate commission for transaction
     * 
     * Pure function, deterministic, safe to retry
     * Enforces Invariant 5: Commission Calculation Determinism
     * 
     * @param params - Calculation parameters
     * @returns Commission calculation breakdown
     */
    calculateCommission(params: {
        grossAmount: Decimal;
        currency: string;
        transactionType: 'property' | 'vehicle';
    }): CommissionCalculation {
        const { grossAmount, currency, transactionType } = params;

        // Validate inputs
        if (grossAmount.lessThanOrEqualTo(0)) {
            throw new Error('Gross amount must be positive');
        }

        if (currency !== 'ETB') {
            throw new Error(`Unsupported currency: ${currency}`);
        }

        // Find applicable commission tier
        const grossAmountNumber = grossAmount.toNumber();
        const tier = this.COMMISSION_TIERS.find(
            (t) => grossAmountNumber >= t.min && grossAmountNumber <= t.max
        );

        if (!tier) {
            throw new Error(`No commission tier found for amount: ${grossAmount}`);
        }

        // Calculate platform fee
        const platformFeePercentage = new Decimal(tier.rate);
        const platformFee = grossAmount.mul(platformFeePercentage);

        // Calculate processor fee
        const processorFeePercentage = new Decimal(this.PROCESSOR_FEE.percentage);
        const processorFeeFixed = new Decimal(this.PROCESSOR_FEE.fixed);
        const processorFee = grossAmount
            .mul(processorFeePercentage)
            .add(processorFeeFixed);

        // Calculate net amount to seller
        const netAmount = grossAmount.sub(platformFee).sub(processorFee);

        // Verify calculation (Invariant 5)
        const verificationSum = netAmount.add(platformFee).add(processorFee);
        if (!verificationSum.equals(grossAmount)) {
            throw new Error(
                `Commission calculation error: ${netAmount} + ${platformFee} + ${processorFee} != ${grossAmount}`
            );
        }

        return {
            grossAmount,
            platformFee,
            platformFeePercentage,
            processorFee,
            netAmount,
            calculationMethod: 'tiered',
            calculationMetadata: {
                tier: {
                    min: tier.min,
                    max: tier.max,
                    rate: tier.rate
                },
                processorFee: {
                    percentage: this.PROCESSOR_FEE.percentage,
                    fixed: this.PROCESSOR_FEE.fixed
                },
                transactionType
            }
        };
    }

    /**
     * Create commission record
     * 
     * Idempotent via transaction ID (unique constraint)
     * 
     * @param params - Commission record parameters
     * @returns Created commission record
     */
    async createCommissionRecord(params: {
        transactionId: string;
        grossAmount: Decimal;
        currency: string;
        transactionType: 'property' | 'vehicle';
    }): Promise<CommissionRecord> {
        // Check if already exists (idempotency)
        const existing = await this.prisma.commissionRecord.findUnique({
            where: { transaction_id: params.transactionId }
        });

        if (existing) {
            this.logger.log(
                `Commission record already exists for transaction ${params.transactionId}`
            );
            return existing;
        }

        // Calculate commission
        const calculation = this.calculateCommission(params);

        // Create record
        const record = await this.prisma.commissionRecord.create({
            data: {
                transaction_id: params.transactionId,
                gross_amount: calculation.grossAmount,
                platform_fee: calculation.platformFee,
                platform_fee_pct: calculation.platformFeePercentage,
                processor_fee: calculation.processorFee,
                net_amount: calculation.netAmount,
                currency: params.currency,
                calculation_method: calculation.calculationMethod,
                calculation_metadata: calculation.calculationMetadata
            }
        });

        this.logger.log(
            `Created commission record for transaction ${params.transactionId}: ` +
            `gross ${calculation.grossAmount}, platform ${calculation.platformFee}, ` +
            `processor ${calculation.processorFee}, net ${calculation.netAmount}`
        );

        return record;
    }

    /**
     * Get commission record
     * 
     * Read-only, safe to retry
     * 
     * @param transactionId - Transaction ID
     * @returns Commission record or null
     */
    async getCommissionRecord(
        transactionId: string
    ): Promise<CommissionRecord | null> {
        return this.prisma.commissionRecord.findUnique({
            where: { transaction_id: transactionId }
        });
    }

    /**
     * Verify commission calculation
     * 
     * Read-only, safe to retry
     * Recalculates commission and compares with stored value
     * 
     * @param transactionId - Transaction ID
     * @returns Verification result
     */
    async verifyCommissionRecord(
        transactionId: string
    ): Promise<VerificationResult> {
        const record = await this.getCommissionRecord(transactionId);

        if (!record) {
            throw new Error(`Commission record not found: ${transactionId}`);
        }

        // Recalculate using stored metadata
        const transactionType = ((record.calculation_metadata || {}) as any).transactionType as 'property' | 'vehicle';

        const recalculated = this.calculateCommission({
            grossAmount: record.gross_amount,
            currency: record.currency,
            transactionType
        });

        const valid = record.net_amount.equals(recalculated.netAmount);

        if (!valid) {
            this.logger.error(
                `Commission verification failed for transaction ${transactionId}: ` +
                `expected ${recalculated.netAmount}, actual ${record.net_amount}`
            );
        }

        return {
            valid,
            expected: recalculated.netAmount,
            actual: record.net_amount
        };
    }

    /**
     * Get commission breakdown for display
     * 
     * Read-only, safe to retry
     * 
     * @param grossAmount - Transaction amount
     * @param currency - Currency code
     * @param transactionType - Type of transaction
     * @returns Commission breakdown
     */
    getCommissionBreakdown(
        grossAmount: Decimal,
        currency: string,
        transactionType: 'property' | 'vehicle'
    ): {
        grossAmount: string;
        platformFee: string;
        platformFeePercentage: string;
        processorFee: string;
        netAmount: string;
        currency: string;
    } {
        const calculation = this.calculateCommission({
            grossAmount,
            currency,
            transactionType
        });

        return {
            grossAmount: calculation.grossAmount.toFixed(2),
            platformFee: calculation.platformFee.toFixed(2),
            platformFeePercentage: calculation.platformFeePercentage
                .mul(100)
                .toFixed(2),
            processorFee: calculation.processorFee.toFixed(2),
            netAmount: calculation.netAmount.toFixed(2),
            currency
        };
    }
}
