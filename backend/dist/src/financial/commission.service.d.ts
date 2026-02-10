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
interface VerificationResult {
    valid: boolean;
    expected: Decimal;
    actual: Decimal;
}
export declare class CommissionService {
    private readonly prisma;
    private readonly logger;
    private readonly COMMISSION_TIERS;
    private readonly PROCESSOR_FEE;
    constructor(prisma: PrismaService);
    calculateCommission(params: {
        grossAmount: Decimal;
        currency: string;
        transactionType: 'property' | 'vehicle';
    }): CommissionCalculation;
    createCommissionRecord(params: {
        transactionId: string;
        grossAmount: Decimal;
        currency: string;
        transactionType: 'property' | 'vehicle';
    }): Promise<CommissionRecord>;
    getCommissionRecord(transactionId: string): Promise<CommissionRecord | null>;
    verifyCommissionRecord(transactionId: string): Promise<VerificationResult>;
    getCommissionBreakdown(grossAmount: Decimal, currency: string, transactionType: 'property' | 'vehicle'): {
        grossAmount: string;
        platformFee: string;
        platformFeePercentage: string;
        processorFee: string;
        netAmount: string;
        currency: string;
    };
}
export {};
