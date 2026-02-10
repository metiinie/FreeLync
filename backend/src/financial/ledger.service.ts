import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
    LedgerEntry,
    LedgerEntryType,
    LedgerEntrySource,
    Prisma
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createHash } from 'crypto';

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

/**
 * LedgerService
 * 
 * Purpose: Immutable, Cryptographically Verifiable Single Source of Truth
 */
@Injectable()
export class LedgerService {
    private readonly logger = new Logger(LedgerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService
    ) { }

    async createEntry(
        params: CreateLedgerEntryParams,
        tx?: Prisma.TransactionClient
    ): Promise<LedgerEntry> {
        const prismaClient = tx || this.prisma;

        try {
            const sellerBalance = await prismaClient.sellerBalance.findUniqueOrThrow({
                where: { id: params.sellerBalanceId }
            });

            // Cast orderBy to any because Typescript types might differ from Schema due to generation issues
            const lastEntry = await prismaClient.ledgerEntry.findFirst({
                where: { seller_balance_id: params.sellerBalanceId },
                orderBy: { sequence: 'desc' } as any
            });

            let sequence = 1;
            let previousHash = 'GENESIS_HASH';
            let balanceBefore = new Decimal(0);

            if (lastEntry) {
                // Cast lastEntry to access integrity fields
                const last = lastEntry as any;
                sequence = (last.sequence || 0) + 1;
                previousHash = last.hash || 'GENESIS_HASH';
                balanceBefore = last.balance_after; // balance_after exists in standard type usually? Wait.
                // balance_after is standard field.
                // But let's be safe.
                if (last.balance_after) balanceBefore = last.balance_after;
            }

            const snapshotBalance = sellerBalance.available_balance.add(sellerBalance.pending_balance);
            if (!snapshotBalance.equals(balanceBefore)) {
                // If this is the VERY first entry, balanceBefore is 0. snapshot might be 0.
                const errorMsg = `CRITICAL LEDGER CORRUPTION: Snapshot (${snapshotBalance}) != Ledger History (${balanceBefore})`;
                this.logger.error(errorMsg);
                throw new Error(errorMsg);
            }

            let balanceAfter: Decimal;
            if (params.type === LedgerEntryType.CREDIT) {
                balanceAfter = balanceBefore.add(params.amount);
            } else if (params.type === LedgerEntryType.DEBIT) {
                balanceAfter = balanceBefore.sub(params.amount);
            } else {
                balanceAfter = balanceBefore;
            }

            const hashInput = `${previousHash}|${params.type}|${params.source}|${params.amount.toString()}|${balanceAfter.toString()}|${sequence}|${params.sellerBalanceId}`;
            const hash = createHash('sha256').update(hashInput).digest('hex');

            // Cast data to any to bypass type check for sequence/hash
            const ledgerEntry = await prismaClient.ledgerEntry.create({
                data: {
                    seller_balance_id: params.sellerBalanceId,
                    type: params.type,
                    source: params.source,
                    amount: params.amount,
                    currency: 'ETB',
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    description: params.description,
                    transaction_id: params.transactionId,
                    payout_request_id: params.payoutRequestId,
                    created_by_id: params.createdById,
                    metadata: params.metadata || {},

                    // Integrity Fields (Force injected)
                    sequence: sequence,
                    previous_hash: previousHash,
                    hash: hash
                } as any
            });

            await this.auditService.log({
                performedBy: {
                    userId: params.createdById || 'system',
                    role: 'super_admin' as any,
                    sessionId: 'system',
                    permissions: [],
                    permissionGroups: [],
                    ip: '127.0.0.1'
                } as any,
                action: `ledger.${params.type.toLowerCase()}`,
                resourceType: 'LedgerEntry',
                resourceId: ledgerEntry.id,
                beforeState: { balance: balanceBefore.toString(), sequence: sequence - 1 },
                afterState: { balance: balanceAfter.toString(), sequence: sequence },
                riskLevel: 'high' as any, // Cast just in case
                status: 'success' as any
            });

            this.logger.log(`Ledger append success: Seq ${sequence} for ${params.sellerBalanceId}`);

            return ledgerEntry;
        } catch (error) {
            this.logger.error(`Ledger append failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async verifyChainIntegrity(sellerBalanceId: string): Promise<IntegrityVerification> {
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { seller_balance_id: sellerBalanceId },
            orderBy: { sequence: 'asc' } as any
        });

        if (entries.length === 0) {
            return { valid: true, lastSequence: 0 };
        }

        let previousHash = 'GENESIS_HASH';
        let expectedSequence = 1;
        let runningBalance = new Decimal(0);

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i] as any; // Cast to access integrity fields

            if (entry.sequence !== expectedSequence) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }

            if (entry.previous_hash !== previousHash) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }

            let expectedBalanceAfter = runningBalance;
            if (entry.type === LedgerEntryType.CREDIT) expectedBalanceAfter = runningBalance.add(entry.amount);
            else if (entry.type === LedgerEntryType.DEBIT) expectedBalanceAfter = runningBalance.sub(entry.amount);

            if (!new Decimal(entry.balance_after).equals(expectedBalanceAfter)) {
                return { valid: false, lastSequence: i, brokenChainIndex: i, discrepancy: new Decimal(entry.balance_after).sub(expectedBalanceAfter) };
            }

            const hashInput = `${previousHash}|${entry.type}|${entry.source}|${entry.amount.toString()}|${entry.balance_after.toString()}|${entry.sequence}|${entry.seller_balance_id}`;
            const expectedHash = createHash('sha256').update(hashInput).digest('hex');

            if (entry.hash !== expectedHash) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }

            previousHash = entry.hash;
            runningBalance = expectedBalanceAfter;
            expectedSequence++;
        }

        return { valid: true, lastSequence: expectedSequence - 1 };
    }

    async calculateBalanceFromLedger(sellerBalanceId: string): Promise<BalanceCalculation> {
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { seller_balance_id: sellerBalanceId },
            select: { type: true, amount: true }
        });

        let credits = new Decimal(0);
        let debits = new Decimal(0);

        for (const entry of entries) {
            if (entry.type === LedgerEntryType.CREDIT) credits = credits.add(entry.amount);
            else if (entry.type === LedgerEntryType.DEBIT) debits = debits.add(entry.amount);
        }

        return { credits, debits, balance: credits.sub(debits) };
    }
}
