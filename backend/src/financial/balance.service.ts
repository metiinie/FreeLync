import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';
import { AuditService } from '../common/services/audit.service';
import {
    SellerBalance,
    LedgerEntry,
    LedgerEntryType,
    LedgerEntrySource,
    Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Custom Error Types
export class InsufficientFundsError extends Error {
    constructor(public available: Decimal, public required: Decimal) {
        super(`Insufficient funds: available ${available}, required ${required}`);
        this.name = 'InsufficientFundsError';
    }
}

export class IdempotencyConflictError extends Error {
    constructor(public key: string) {
        super(`Idempotency conflict: key ${key} already used`);
        this.name = 'IdempotencyConflictError';
    }
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

@Injectable()
export class BalanceService {
    private readonly logger = new Logger(BalanceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ledgerService: LedgerService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Get or create seller balance
     * Idempotent, safe to retry
     */
    async getOrCreateBalance(userId: string, tx?: Prisma.TransactionClient): Promise<SellerBalance> {
        const prisma = tx || this.prisma;
        const existing = await prisma.sellerBalance.findUnique({
            where: { user_id: userId },
        });

        if (existing) {
            return existing;
        }

        try {
            return await prisma.sellerBalance.create({
                data: {
                    user_id: userId,
                    available_balance: new Decimal(0),
                    pending_balance: new Decimal(0),
                    total_earned: new Decimal(0),
                    total_withdrawn: new Decimal(0),
                    currency: 'ETB',
                },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                const existingRetry = await prisma.sellerBalance.findUnique({
                    where: { user_id: userId },
                });
                if (existingRetry) return existingRetry;
            }
            throw error;
        }
    }

    /**
     * Credit seller balance (atomic, transaction-aware)
     */
    async credit(params: CreditParams, tx?: Prisma.TransactionClient): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }> {
        const execute = async (txClient: Prisma.TransactionClient) => {
            // 1. Lock Balance
            const balance = await this.getLockedBalance(txClient, params.userId);

            // 2. State
            const availableAfter = balance.available_balance.add(params.amount);
            const totalEarnedAfter = balance.total_earned.add(params.amount);

            // 3. Ledger
            const ledgerEntry = await this.ledgerService.createEntry(
                {
                    sellerBalanceId: balance.id,
                    type: LedgerEntryType.CREDIT,
                    source: params.source,
                    amount: params.amount,
                    description: params.description,
                    transactionId: params.transactionId,
                    metadata: { ...params.metadata, idempotencyKey: params.idempotencyKey },
                },
                txClient,
            );

            // 4. Update
            const updatedBalance = await txClient.sellerBalance.update({
                where: { id: balance.id },
                data: {
                    available_balance: availableAfter,
                    total_earned: totalEarnedAfter,
                },
            });

            // 5. Audit
            await this.auditService.log({
                performedBy: {
                    userId: 'system',
                    role: 'super_admin' as any,
                    sessionId: 'system',
                    permissions: [],
                    permissionGroups: [],
                    ip: '127.0.0.1'
                } as any,
                action: 'balance.credit',
                resourceType: 'SellerBalance',
                resourceId: balance.id,
                beforeState: { available: balance.available_balance, earned: balance.total_earned },
                afterState: { available: availableAfter, earned: totalEarnedAfter },
                riskLevel: 'medium',
                status: 'success',
            });

            return { balance: updatedBalance, ledgerEntry };
        };

        return tx ? execute(tx) : this.prisma.$transaction(execute, { timeout: 10000 });
    }

    /**
     * Debit seller balance (atomic, transaction-aware)
     */
    async debit(params: DebitParams, tx?: Prisma.TransactionClient): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }> {
        const execute = async (txClient: Prisma.TransactionClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);

            let balanceType: 'available' | 'pending' = 'available';
            if (params.source === LedgerEntrySource.PAYOUT_COMPLETED) {
                balanceType = 'pending';
            }

            const balanceBefore = balanceType === 'available' ? balance.available_balance : balance.pending_balance;

            if (balanceBefore.lessThan(params.amount)) {
                throw new InsufficientFundsError(balanceBefore, params.amount);
            }

            const balanceAfter = balanceBefore.sub(params.amount);

            const ledgerEntry = await this.ledgerService.createEntry(
                {
                    sellerBalanceId: balance.id,
                    type: LedgerEntryType.DEBIT,
                    source: params.source,
                    amount: params.amount,
                    description: params.description,
                    payoutRequestId: params.payoutRequestId,
                    metadata: { ...params.metadata, idempotencyKey: params.idempotencyKey, balanceType },
                },
                txClient,
            );

            const updateData: any = {};
            if (balanceType === 'available') {
                updateData.available_balance = balanceAfter;
            } else {
                updateData.pending_balance = balanceAfter;
                if (params.source === LedgerEntrySource.PAYOUT_COMPLETED) {
                    updateData.total_withdrawn = balance.total_withdrawn.add(params.amount);
                }
            }

            const updatedBalance = await txClient.sellerBalance.update({
                where: { id: balance.id },
                data: updateData,
            });

            return { balance: updatedBalance, ledgerEntry };
        };

        return tx ? execute(tx) : this.prisma.$transaction(execute, { timeout: 10000 });
    }

    /**
     * Hold funds (atomic, transaction-aware)
     */
    async holdFunds(params: HoldParams, tx?: Prisma.TransactionClient): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }> {
        const execute = async (txClient: Prisma.TransactionClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);

            if (balance.available_balance.lessThan(params.amount)) {
                throw new InsufficientFundsError(balance.available_balance, params.amount);
            }

            const availableAfter = balance.available_balance.sub(params.amount);
            const pendingAfter = balance.pending_balance.add(params.amount);

            const ledgerEntry = await this.ledgerService.createEntry(
                {
                    sellerBalanceId: balance.id,
                    type: LedgerEntryType.HOLD,
                    source: LedgerEntrySource.PAYOUT_REQUESTED,
                    amount: params.amount,
                    description: params.reason,
                    payoutRequestId: params.payoutRequestId,
                    metadata: { idempotencyKey: params.idempotencyKey },
                },
                txClient,
            );

            const updatedBalance = await txClient.sellerBalance.update({
                where: { id: balance.id },
                data: {
                    available_balance: availableAfter,
                    pending_balance: pendingAfter,
                },
            });

            return { balance: updatedBalance, ledgerEntry };
        };

        return tx ? execute(tx) : this.prisma.$transaction(execute, { timeout: 10000 });
    }

    /**
     * Release held funds (atomic, transaction-aware)
     */
    async releaseHeldFunds(params: ReleaseHoldParams, tx?: Prisma.TransactionClient): Promise<{ balance: SellerBalance; ledgerEntry: LedgerEntry }> {
        const execute = async (txClient: Prisma.TransactionClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);

            if (balance.pending_balance.lessThan(params.amount)) {
                throw new Error(`Cannot release ${params.amount} from pending balance ${balance.pending_balance}. Inconsistent state.`);
            }

            const pendingAfter = balance.pending_balance.sub(params.amount);
            const availableAfter = balance.available_balance.add(params.amount);

            const ledgerEntry = await this.ledgerService.createEntry(
                {
                    sellerBalanceId: balance.id,
                    type: LedgerEntryType.RELEASE_HOLD,
                    source: params.source,
                    amount: params.amount,
                    description: params.reason,
                    payoutRequestId: params.payoutRequestId,
                    metadata: { idempotencyKey: params.idempotencyKey },
                },
                txClient,
            );

            const updatedBalance = await txClient.sellerBalance.update({
                where: { id: balance.id },
                data: {
                    available_balance: availableAfter,
                    pending_balance: pendingAfter,
                },
            });

            return { balance: updatedBalance, ledgerEntry };
        };

        return tx ? execute(tx) : this.prisma.$transaction(execute, { timeout: 10000 });
    }

    async verifyBalance(userId: string): Promise<BalanceVerification> {
        const balance = await this.getOrCreateBalance(userId);
        const ledgerCalc = await this.ledgerService.calculateBalanceFromLedger(balance.id);

        const actualTotal = balance.available_balance.add(balance.pending_balance);
        const expectedTotal = ledgerCalc.balance;
        const discrepancy = actualTotal.sub(expectedTotal);

        const valid = discrepancy.equals(0);

        return {
            valid,
            expected: expectedTotal,
            actual: actualTotal,
            discrepancy: valid ? undefined : discrepancy,
        };
    }

    private async getLockedBalance(tx: Prisma.TransactionClient, userId: string): Promise<SellerBalance> {
        await tx.$executeRaw`SELECT 1 FROM "seller_balances" WHERE "user_id" = ${userId} FOR UPDATE`;

        const balance = await tx.sellerBalance.findUnique({
            where: { user_id: userId },
        });

        if (!balance) {
            throw new Error(`Seller balance not found for user ${userId}`);
        }

        return balance;
    }
}
