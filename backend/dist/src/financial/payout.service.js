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
var PayoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const balance_service_1 = require("./balance.service");
const financial_orchestrator_service_1 = require("./financial.orchestrator.service");
const payment_service_1 = require("../payment/payment.service");
const client_1 = require("@prisma/client");
const payment_adapter_interface_1 = require("../payment/interfaces/payment-adapter.interface");
let PayoutService = PayoutService_1 = class PayoutService {
    prisma;
    balanceService;
    financialOrchestration;
    paymentService;
    logger = new common_1.Logger(PayoutService_1.name);
    constructor(prisma, balanceService, financialOrchestration, paymentService) {
        this.prisma = prisma;
        this.balanceService = balanceService;
        this.financialOrchestration = financialOrchestration;
        this.paymentService = paymentService;
    }
    async requestPayout(params) {
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
                    status: 'PENDING',
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
    async approvePayout(params) {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUniqueOrThrow({
                where: { id: params.payoutRequestId }
            });
            if (request.status !== 'PENDING') {
                if (request.status === 'APPROVED' && request.approved_by_id === params.adminId) {
                    return request;
                }
                throw new Error(`Payout request ${params.payoutRequestId} is not PENDING. Status: ${request.status}`);
            }
            const updatedRequest = await tx.payoutRequest.update({
                where: { id: params.payoutRequestId },
                data: {
                    status: 'APPROVED',
                    approved_at: new Date(),
                    approved_by_id: params.adminId
                }
            });
            this.logger.log(`Payout approved: ${params.payoutRequestId} by ${params.adminId}`);
            return updatedRequest;
        });
    }
    async rejectPayout(params) {
        return this.prisma.$transaction(async (tx) => {
            const request = await tx.payoutRequest.findUniqueOrThrow({
                where: { id: params.payoutRequestId }
            });
            if (request.status !== 'PENDING') {
                if (request.status === 'REJECTED')
                    return request;
                throw new Error(`Payout request ${params.payoutRequestId} is not PENDING. Status: ${request.status}`);
            }
            const updatedRequest = await tx.payoutRequest.update({
                where: { id: params.payoutRequestId },
                data: {
                    status: 'REJECTED',
                    rejected_at: new Date(),
                    rejected_by_id: params.adminId,
                    rejection_reason: params.rejectionReason
                }
            });
            await this.balanceService.releaseHeldFunds({
                userId: request.seller_id,
                amount: request.amount,
                reason: `Payout rejected: ${params.rejectionReason}`,
                source: client_1.LedgerEntrySource.PAYOUT_REJECTED,
                payoutRequestId: request.id,
                idempotencyKey: `reject-${request.id}`
            }, tx);
            this.logger.log(`Payout rejected: ${params.payoutRequestId}`);
            return updatedRequest;
        });
    }
    async processPayout(payoutRequestId) {
        const request = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutRequestId },
            include: { seller: true }
        });
        if (!request || request.status !== 'APPROVED') {
            if (request?.status === 'PROCESSING')
                return request;
            if (request?.status === 'COMPLETED')
                return request;
            throw new Error(`Invalid request state for processing: ${request?.status}`);
        }
        await this.prisma.payoutRequest.update({
            where: { id: request.id },
            data: { status: 'PROCESSING', processing_started_at: new Date() }
        });
        try {
            const result = await this.paymentService.executePayout({
                amount: request.amount.toNumber(),
                currency: request.currency,
                recipientDetails: request.payment_details,
                reference: request.id,
                metadata: request.metadata
            });
            if (result.status === payment_adapter_interface_1.PaymentStatus.SUCCESS) {
                const completedResult = await this.financialOrchestration.completePayout({
                    payoutRequestId: request.id,
                    providerPayoutId: result.payoutId,
                    providerResponse: result.rawResponse,
                    idempotencyKey: `complete-${request.id}`
                });
                return completedResult.payoutRequest;
            }
            else if (result.status === payment_adapter_interface_1.PaymentStatus.PENDING) {
                return this.prisma.payoutRequest.update({
                    where: { id: request.id },
                    data: {
                        provider_payout_id: result.payoutId,
                        provider_response: result.rawResponse
                    }
                });
            }
            else {
                return this.prisma.payoutRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'FAILED',
                        failed_at: new Date(),
                        failure_reason: 'Provider rejected request',
                        provider_response: result.rawResponse
                    }
                });
            }
        }
        catch (error) {
            this.logger.error(`Payout processing exception for ${request.id}`, error);
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
};
exports.PayoutService = PayoutService;
exports.PayoutService = PayoutService = PayoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        balance_service_1.BalanceService,
        financial_orchestrator_service_1.FinancialOrchestrationService,
        payment_service_1.PaymentService])
], PayoutService);
//# sourceMappingURL=payout.service.js.map