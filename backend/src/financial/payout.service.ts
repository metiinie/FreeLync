import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';
import { FinancialOrchestrationService } from './financial.orchestrator.service';
import { PaymentService } from '../payment/payment.service';
import {
    PayoutRequest,
    PayoutRequestStatus,
    LedgerEntrySource,
    Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentStatus } from '../payment/interfaces/payment-adapter.interface';

// Invariant 4: Payout-Balance Consistency
// Invariant 8: Idempotency
// Invariant 9: Audit Completeness

interface AdminContext {
    userId: string;
    role: string;
}

@Injectable()
export class PayoutService {
    private readonly logger = new Logger(PayoutService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly balanceService: BalanceService,
        private readonly financialOrchestration: FinancialOrchestrationService,
        private readonly paymentService: PaymentService, // Injected Pure Execution Adapter
    ) { }

    /**
     * Request payout (seller-initiated)
     */
    async requestPayout(params: {
        sellerId: string;
        amount: Decimal;
        paymentMethod: string;
        paymentDetails: Record<string, any>; // { phone: ..., bank_code: ... }
        idempotencyKey: string;
        metadata?: Record<string, any>;
    }): Promise<PayoutRequest> {
        if (params.amount.lessThanOrEqualTo(0)) {
            throw new Error('Payout amount must be positive');
        }

        return this.prisma.$transaction(async (tx) => {
            const balance = await this.balanceService.getOrCreateBalance(params.sellerId, tx);

            const payoutRequest = await tx.payoutRequest.create({
                data: {
                    seller_id: params.sellerId,
                    seller_balance_id: balance.id,
                    amount: params.amount,
                    currency: 'ETB',
                    status: 'PENDING', // PayoutRequestStatus.PENDING
                    payment_method: params.paymentMethod,
                    payment_details: params.paymentDetails,
                    metadata: params.metadata || {},
                }
            });

            await this.balanceService.holdFunds({
                userId: params.sellerId,
                amount: params.amount,
                reason: 'Payout requested',
                payoutRequestId: payoutRequest.id,
                idempotencyKey: params.idempotencyKey
            }, tx);

            this.logger.log(`Payout requested: ${payoutRequest.id} for ${params.amount} ETB`);
            return payoutRequest;
        }, { timeout: 10000 });
    }

    /**
     * Approve payout (admin action)
     */
    async approvePayout(params: {
        payoutRequestId: string;
        adminId: string;
        adminContext: AdminContext;
    }): Promise<PayoutRequest> {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUniqueOrThrow({
                where: { id: params.payoutRequestId }
            });

            // Idempotency Check
            if (request.status !== 'PENDING') {
                if (request.status === 'APPROVED' && request.approved_by_id === params.adminId) {
                    return request;
                }
                throw new Error(`Payout request ${params.payoutRequestId} is not PENDING. Status: ${request.status}`);
            }

            const updatedRequest = await tx.payoutRequest.update({
                where: { id: params.payoutRequestId },
                data: {
                    status: 'APPROVED', // PayoutRequestStatus.APPROVED
                    approved_at: new Date(),
                    approved_by_id: params.adminId
                }
            });

            this.logger.log(`Payout approved: ${params.payoutRequestId} by ${params.adminId}`);

            return updatedRequest;
        });
    }

    /**
     * Reject payout (admin action)
     */
    async rejectPayout(params: {
        payoutRequestId: string;
        adminId: string;
        rejectionReason: string;
        adminContext: AdminContext;
    }): Promise<PayoutRequest> {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUniqueOrThrow({
                where: { id: params.payoutRequestId }
            });

            if (request.status !== 'PENDING') {
                if (request.status === 'REJECTED') return request;
                throw new Error(`Payout request ${params.payoutRequestId} is not PENDING. Status: ${request.status}`);
            }

            const updatedRequest = await tx.payoutRequest.update({
                where: { id: params.payoutRequestId },
                data: {
                    status: 'REJECTED', // PayoutRequestStatus.REJECTED
                    rejected_at: new Date(),
                    rejected_by_id: params.adminId,
                    rejection_reason: params.rejectionReason
                }
            });

            await this.balanceService.releaseHeldFunds({
                userId: request.seller_id,
                amount: request.amount,
                reason: `Payout rejected: ${params.rejectionReason}`,
                source: LedgerEntrySource.PAYOUT_REJECTED,
                payoutRequestId: request.id,
                idempotencyKey: `reject-${request.id}`
            }, tx);

            this.logger.log(`Payout rejected: ${params.payoutRequestId}`);
            return updatedRequest;
        });
    }

    /**
     * Process payout (Execution Phase)
     * Integrates external provider via Adapter Pattern
     */
    async processPayout(payoutRequestId: string): Promise<PayoutRequest> {
        const request = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutRequestId },
            include: { seller: true } // Need user details? Or payment_details sufficient.
        });

        if (!request || request.status !== 'APPROVED') {
            // If already processing, idempotent return?
            if (request?.status === 'PROCESSING') return request; // Already in flight
            // If COMPLETED, return.
            if (request?.status === 'COMPLETED') return request;

            throw new Error(`Invalid request state for processing: ${request?.status}`);
        }

        // Mark PROCESSING to prevent double-execution
        await this.prisma.payoutRequest.update({
            where: { id: request.id },
            data: { status: 'PROCESSING', processing_started_at: new Date() }
        });

        try {
            // Execute via Adapter (Pure Execution, no side effects on internal ledger yet)
            const result = await this.paymentService.executePayout({
                amount: request.amount.toNumber(),
                currency: request.currency,
                recipientDetails: request.payment_details,
                reference: request.id,
                metadata: request.metadata
            });

            if (result.status === PaymentStatus.SUCCESS) {
                // Immediate success (rare for bank transfers, common for mocks)
                // Complete Orchestration (Debit Pending Balance)
                const completedResult = await this.financialOrchestration.completePayout({
                    payoutRequestId: request.id,
                    providerPayoutId: result.payoutId,
                    providerResponse: result.rawResponse,
                    idempotencyKey: `complete-${request.id}`
                });
                return completedResult.payoutRequest;
            }
            else if (result.status === PaymentStatus.PENDING) {
                // Async processing initiated
                return this.prisma.payoutRequest.update({
                    where: { id: request.id },
                    data: {
                        provider_payout_id: result.payoutId,
                        provider_response: result.rawResponse as any
                    }
                });
            }
            else {
                // Explicit Failure (Invalid Account, etc.)
                // Mark FAILED. Do NOT release funds automatically (Admin Safety).
                return this.prisma.payoutRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'FAILED',
                        failed_at: new Date(),
                        failure_reason: 'Provider rejected request', // improve msg from rawResponse
                        provider_response: result.rawResponse as any
                    }
                });
            }

        } catch (error) {
            this.logger.error(`Payout processing exception for ${request.id}`, error);
            // Transient or Permanent?
            // Safest to leave as PROCESSING (stuck) or Mark FAILED.
            // Mark FAILED to allow retry/intervention.
            return this.prisma.payoutRequest.update({
                where: { id: request.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failure_reason: error.message
                }
            });
        }
    }
}
