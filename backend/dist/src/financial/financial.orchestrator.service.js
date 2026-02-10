"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FinancialOrchestrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialOrchestrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const balance_service_1 = require("./balance.service");
const commission_service_1 = require("./commission.service");
const ledger_service_1 = require("./ledger.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let FinancialOrchestrationService = FinancialOrchestrationService_1 = class FinancialOrchestrationService {
    prisma;
    balanceService;
    commissionService;
    ledgerService;
    logger = new common_1.Logger(FinancialOrchestrationService_1.name);
    constructor(prisma, balanceService, commissionService, ledgerService) {
        this.prisma = prisma;
        this.balanceService = balanceService;
        this.commissionService = commissionService;
        this.ledgerService = ledgerService;
    }
    async releaseEscrowToSeller(params) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUniqueOrThrow({
                where: { id: params.transactionId },
            });
            const escrowData = transaction.escrow;
            if (!escrowData?.is_escrowed) {
                throw new Error(`Transaction ${params.transactionId} is not in escrow`);
            }
            const existingCommission = await tx.commissionRecord.findUnique({
                where: { transaction_id: params.transactionId },
            });
            if (existingCommission) {
                const existingLedger = await tx.ledgerEntry.findFirst({
                    where: {
                        transaction_id: params.transactionId,
                        source: client_1.LedgerEntrySource.ESCROW_RELEASE
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
            const commissionCalc = this.commissionService.calculateCommission({
                grossAmount: new library_1.Decimal(transaction.amount),
                currency: transaction.currency,
                transactionType: 'property',
            });
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
            const updatedTransaction = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'completed',
                }
            });
            const creditResult = await this.balanceService.credit({
                userId: transaction.seller_id,
                amount: commissionCalc.netAmount,
                source: client_1.LedgerEntrySource.ESCROW_RELEASE,
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
        }, { timeout: 15000 });
    }
    async processRefund(params) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUniqueOrThrow({
                where: { id: params.transactionId },
                include: { commission_record: true }
            });
            let refundAmount = params.amount;
            let platformFeeReversal = new library_1.Decimal(0);
            if (params.reversePlatformFee && transaction.commission_record) {
                if (params.amount.equals(new library_1.Decimal(transaction.amount))) {
                    platformFeeReversal = transaction.commission_record.platform_fee;
                }
            }
            const refundRecord = await tx.refundRecord.create({
                data: {
                    transaction_id: transaction.id,
                    amount: refundAmount,
                    reason: params.reason,
                    status: client_1.RefundStatus.COMPLETED,
                    initiated_by_id: params.initiatedById,
                    reverse_platform_fee: params.reversePlatformFee,
                    reversed_fee: platformFeeReversal
                }
            });
            let updatedBalance;
            let ledgerEntry;
            if (transaction.status === 'completed') {
                const debitAmount = params.amount.sub(platformFeeReversal);
                const debitResult = await this.balanceService.debit({
                    userId: transaction.seller_id,
                    amount: debitAmount,
                    source: client_1.LedgerEntrySource.REFUND_ISSUED,
                    description: `Refund for transaction ${transaction.id}`,
                    idempotencyKey: params.idempotencyKey,
                    metadata: { refundId: refundRecord.id }
                }, tx);
                updatedBalance = debitResult.balance;
                ledgerEntry = debitResult.ledgerEntry;
            }
            return { refundRecord, sellerBalance: updatedBalance, ledgerEntry };
        }, { timeout: 15000 });
    }
    async completePayout(params) {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUniqueOrThrow({
                where: { id: params.payoutRequestId },
                include: { seller: true }
            });
            if (request.status !== 'PROCESSING' && request.status !== 'APPROVED') {
                if (request.status === 'COMPLETED') {
                    const existingLedger = await tx.ledgerEntry.findFirst({
                        where: { payout_request_id: params.payoutRequestId, source: client_1.LedgerEntrySource.PAYOUT_COMPLETED }
                    });
                    if (existingLedger) {
                        const balance = await tx.sellerBalance.findUniqueOrThrow({ where: { user_id: request.seller_id } });
                        return { payoutRequest: request, sellerBalance: balance, ledgerEntry: existingLedger };
                    }
                }
                throw new Error(`Payout request ${params.payoutRequestId} is not in valid state for completion: ${request.status}`);
            }
            const debitResult = await this.balanceService.debit({
                userId: request.seller_id,
                amount: request.amount,
                source: client_1.LedgerEntrySource.PAYOUT_COMPLETED,
                description: `Payout completed`,
                payoutRequestId: request.id,
                idempotencyKey: params.idempotencyKey,
                metadata: {
                    providerPayoutId: params.providerPayoutId,
                }
            }, tx);
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
        }, { timeout: 15000 });
    }
};
exports.FinancialOrchestrationService = FinancialOrchestrationService;
exports.FinancialOrchestrationService = FinancialOrchestrationService = FinancialOrchestrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        balance_service_1.BalanceService,
        commission_service_1.CommissionService,
        ledger_service_1.LedgerService])
], FinancialOrchestrationService);
//# sourceMappingURL=financial.orchestrator.service.js.map