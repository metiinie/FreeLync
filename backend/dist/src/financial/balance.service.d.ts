import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { AuditService } from '../common/services/audit.service';
import { SellerBalance, LedgerEntry, LedgerEntrySource, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class InsufficientFundsError extends Error {
    available: Decimal;
    required: Decimal;
    constructor(available: Decimal, required: Decimal);
}
export declare class IdempotencyConflictError extends Error {
    key: string;
    constructor(key: string);
}
interface CreditParams {
    userId: string;
    amount: Decimal;
    source: LedgerEntrySource;
    description: string;
    transactionId?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
}
interface DebitParams {
    userId: string;
    amount: Decimal;
    source: LedgerEntrySource;
    description: string;
    payoutRequestId?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
}
interface HoldParams {
    userId: string;
    amount: Decimal;
    reason: string;
    payoutRequestId: string;
    idempotencyKey: string;
}
interface ReleaseHoldParams {
    userId: string;
    amount: Decimal;
    reason: string;
    source: LedgerEntrySource;
    payoutRequestId: string;
    idempotencyKey: string;
}
interface BalanceVerification {
    valid: boolean;
    expected: Decimal;
    actual: Decimal;
    discrepancy?: Decimal;
}
export declare class BalanceService {
    private readonly prisma;
    private readonly ledgerService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, ledgerService: LedgerService, auditService: AuditService);
    getOrCreateBalance(userId: string, tx?: Prisma.TransactionClient): Promise<SellerBalance>;
    credit(params: CreditParams, tx?: Prisma.TransactionClient): Promise<{
        balance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
    debit(params: DebitParams, tx?: Prisma.TransactionClient): Promise<{
        balance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
    holdFunds(params: HoldParams, tx?: Prisma.TransactionClient): Promise<{
        balance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
    releaseHeldFunds(params: ReleaseHoldParams, tx?: Prisma.TransactionClient): Promise<{
        balance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }>;
    verifyBalance(userId: string): Promise<BalanceVerification>;
    private getLockedBalance;
}
export {};
