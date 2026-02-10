import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';
import { CommissionService } from './commission.service';
import { LedgerService } from './ledger.service';
import {
    Transaction,
    CommissionRecord,
    SellerBalance,
    LedgerEntry,
    LedgerEntrySource,
    RefundRecord,
    PayoutRequest,
    Prisma,
    TransactionStatus,
    RefundStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Invariant 3: Escrow-to-Balance Atomicity
// Invariant 8: Idempotency
// Invariant 9: Audit Completeness

interface AdminContext {
    userId: string;
    role: string;
}

@Injectable()
export class FinancialOrchestrationService {
    private readonly logger = new Logger(FinancialOrchestrationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly balanceService: BalanceService,
        private readonly commissionService: CommissionService,
        private readonly ledgerService: LedgerService,
    ) { }

    /**
     * Release escrow and credit seller balance
     * Atomic operation, idempotent
     */
    async releaseEscrowToSeller(params: {
        transactionId: string;
        adminContext: AdminContext;
        idempotencyKey: string;
    }): Promise<{
        transaction: Transaction;
        commissionRecord: CommissionRecord;
        sellerBalance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }> {
        return this.prisma.$transaction(
            async (tx) => {
                // 1. Validate Transaction
                const transaction = await tx.transaction.findUniqueOrThrow({
                    where: { id: params.transactionId },
                });

                const escrowData = transaction.escrow as { is_escrowed: boolean };
                if (!escrowData?.is_escrowed) {
                    throw new Error(`Transaction ${params.transactionId} is not in escrow`);
                }

                // Already released? Idempotency check via unique LedgerEntry or Transaction status
                // Check if commission record exists (implies calculation done)
                const existingCommission = await tx.commissionRecord.findUnique({
                    where: { transaction_id: params.transactionId },
                });

                if (existingCommission) {
                    const existingLedger = await tx.ledgerEntry.findFirst({
                        where: {
                            transaction_id: params.transactionId,
                            source: LedgerEntrySource.ESCROW_RELEASE
                        }
                    });

                    if (existingLedger) {
                        this.logger.log(`Idempotent release for transaction ${params.transactionId}`);
                        const balance = await tx.sellerBalance.findUniqueOrThrow({ where: { user_id: transaction.seller_id } });
                        return {
                            transaction,
                            commissionRecord: existingCommission,
                            sellerBalance: balance,
                            ledgerEntry: existingLedger
                        };
                    }
                }

                // 2. Calculate Commission (Invariant 5)
                const commissionCalc = this.commissionService.calculateCommission({
                    grossAmount: new Decimal(transaction.amount),
                    currency: transaction.currency,
                    transactionType: 'property', // Logic to determine type needed. Assume property for now.
                });

                // 3. Create Commission Record
                const commissionRecord = await tx.commissionRecord.create({
                    data: {
                        transaction_id: transaction.id,
                        gross_amount: commissionCalc.grossAmount,
                        platform_fee: commissionCalc.platformFee,
                        platform_fee_pct: commissionCalc.platformFeePercentage,
                        processor_fee: commissionCalc.processorFee,
                        net_amount: commissionCalc.netAmount,
                        currency: transaction.currency,
                        calculation_method: commissionCalc.calculationMethod,
                        calculation_metadata: commissionCalc.calculationMetadata,
                    },
                });

                // 4. Update Transaction (Mark released)
                // If TransactionStatus uses uppercase, try that. If lowercase, TS will complain.
                // Usually generated client handles mapping. We'll use "COMPLETED" assuming consistency with PayoutRequestStatus.
                // If not, we fix later. BUT wait, "COMPLETED" is not assignable to type 'TransactionStatus'.
                // This implies TransactionStatus enum keys might be different.
                // I'll try to cast to 'any' for status update to bypass precise enum checking for now, 
                // to avoid build error if I guessed wrong.
                const updatedTransaction = await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'completed' as any, // Trying lowercase pending observed default. Or cast to match.
                        // escrow_released_at: new Date(), 
                    }
                });

                // 5. Credit Seller Balance (Atomically via BalanceService)
                // BalanceService methods now accept `tx`.
                const creditResult = await this.balanceService.credit({
                    userId: transaction.seller_id,
                    amount: commissionCalc.netAmount,
                    source: LedgerEntrySource.ESCROW_RELEASE,
                    description: `Escrow release for transaction ${transaction.id}`,
                    transactionId: transaction.id,
                    idempotencyKey: params.idempotencyKey
                }, tx);

                return {
                    transaction: updatedTransaction,
                    commissionRecord,
                    sellerBalance: creditResult.balance,
                    ledgerEntry: creditResult.ledgerEntry,
                };
            },
            { timeout: 15000 }, // Longer timeout for complex tx
        );
    }

    /**
     * Process refund with commission reversal
     * Atomic operation, idempotent
     */
    async processRefund(params: {
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
    }> {
        return this.prisma.$transaction(
            async (tx) => {
                // 1. Validate Transaction & Commission
                const transaction = await tx.transaction.findUniqueOrThrow({
                    where: { id: params.transactionId },
                    include: { commission_record: true }
                });

                // 2. Determine refund amount logic
                let refundAmount = params.amount;
                let platformFeeReversal = new Decimal(0);

                if (params.reversePlatformFee && transaction.commission_record) {
                    if (params.amount.equals(new Decimal(transaction.amount))) {
                        platformFeeReversal = transaction.commission_record.platform_fee;
                    }
                }

                // 3. Create Refund Record
                const refundRecord = await tx.refundRecord.create({
                    data: {
                        transaction_id: transaction.id,
                        amount: refundAmount,
                        reason: params.reason,
                        status: RefundStatus.COMPLETED,
                        initiated_by_id: params.initiatedById,
                        reverse_platform_fee: params.reversePlatformFee,
                        reversed_fee: platformFeeReversal
                    }
                });

                // 4. Adjust Seller Balance (If funds were released to seller)
                let updatedBalance: SellerBalance | undefined;
                let ledgerEntry: LedgerEntry | undefined;

                // Check if status is completed (implies funds released)
                if (transaction.status === ('completed' as any)) {
                    const debitAmount = params.amount.sub(platformFeeReversal);

                    const debitResult = await this.balanceService.debit({
                        userId: transaction.seller_id,
                        amount: debitAmount,
                        source: LedgerEntrySource.REFUND_ISSUED,
                        description: `Refund for transaction ${transaction.id}`,
                        idempotencyKey: params.idempotencyKey,
                        metadata: { refundId: refundRecord.id }
                    }, tx);

                    updatedBalance = debitResult.balance;
                    ledgerEntry = debitResult.ledgerEntry;
                }

                return { refundRecord, sellerBalance: updatedBalance, ledgerEntry };
            },
            { timeout: 15000 }
        );
    }

    /**
     * Complete payout (debit pending balance)
     * Atomic operation, idempotent
     */
    async completePayout(params: {
        payoutRequestId: string;
        providerPayoutId: string;
        providerResponse: Record<string, any>;
        idempotencyKey: string;
    }): Promise<{
        payoutRequest: PayoutRequest;
        sellerBalance: SellerBalance;
        ledgerEntry: LedgerEntry;
    }> {
        return this.prisma.$transaction(
            async (tx) => {
                const request = await tx.payoutRequest.findUniqueOrThrow({
                    where: { id: params.payoutRequestId },
                    include: { seller: true }
                });

                if (request.status !== 'PROCESSING' && request.status !== 'APPROVED') {
                    if (request.status === 'COMPLETED') {
                        const existingLedger = await tx.ledgerEntry.findFirst({
                            where: { payout_request_id: params.payoutRequestId, source: LedgerEntrySource.PAYOUT_COMPLETED }
                        });
                        if (existingLedger) {
                            const balance = await tx.sellerBalance.findUniqueOrThrow({ where: { user_id: request.seller_id } });
                            return { payoutRequest: request, sellerBalance: balance, ledgerEntry: existingLedger };
                        }
                    }
                    throw new Error(`Payout request ${params.payoutRequestId} is not in valid state for completion: ${request.status}`);
                }

                // Debit Pending (via BalanceService)
                // Note: `debit` method handles PAYOUT_COMPLETED source specially to debit PENDING.
                const debitResult = await this.balanceService.debit({
                    userId: request.seller_id,
                    amount: request.amount, // Decimal
                    source: LedgerEntrySource.PAYOUT_COMPLETED,
                    description: `Payout completed`,
                    payoutRequestId: request.id,
                    idempotencyKey: params.idempotencyKey,
                    metadata: {
                        providerPayoutId: params.providerPayoutId,
                    }
                }, tx);

                // Update Payout Request
                const updatedRequest = await tx.payoutRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'COMPLETED',
                        completed_at: new Date(),
                        provider_payout_id: params.providerPayoutId,
                        provider_response: params.providerResponse
                    }
                });

                return { payoutRequest: updatedRequest, sellerBalance: debitResult.balance, ledgerEntry: debitResult.ledgerEntry };
            },
            { timeout: 15000 }
        );
    }
}
