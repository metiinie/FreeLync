import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { LedgerEntry, LedgerEntryType, LedgerEntrySource, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
interface CreateLedgerEntryParams {
    sellerBalanceId: string;
    type: LedgerEntryType;
    source: LedgerEntrySource;
    amount: Decimal;
    description: string;
    transactionId?: string;
    payoutRequestId?: string;
    createdById?: string;
    metadata?: Record<string, any>;
}
interface IntegrityVerification {
    valid: boolean;
    lastSequence: number;
    discrepancy?: Decimal;
    brokenChainIndex?: number;
}
interface BalanceCalculation {
    credits: Decimal;
    debits: Decimal;
    balance: Decimal;
}
export declare class LedgerService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    createEntry(params: CreateLedgerEntryParams, tx?: Prisma.TransactionClient): Promise<LedgerEntry>;
    verifyChainIntegrity(sellerBalanceId: string): Promise<IntegrityVerification>;
    calculateBalanceFromLedger(sellerBalanceId: string): Promise<BalanceCalculation>;
}
export {};
