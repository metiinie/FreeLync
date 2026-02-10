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
var CommissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let CommissionService = CommissionService_1 = class CommissionService {
    prisma;
    logger = new common_1.Logger(CommissionService_1.name);
    COMMISSION_TIERS = [
        { min: 0, max: 10000, rate: 0.05 },
        { min: 10001, max: 50000, rate: 0.03 },
        { min: 50001, max: Infinity, rate: 0.02 }
    ];
    PROCESSOR_FEE = {
        percentage: 0.025,
        fixed: 5
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateCommission(params) {
        const { grossAmount, currency, transactionType } = params;
        if (grossAmount.lessThanOrEqualTo(0)) {
            throw new Error('Gross amount must be positive');
        }
        if (currency !== 'ETB') {
            throw new Error(`Unsupported currency: ${currency}`);
        }
        const grossAmountNumber = grossAmount.toNumber();
        const tier = this.COMMISSION_TIERS.find((t) => grossAmountNumber >= t.min && grossAmountNumber <= t.max);
        if (!tier) {
            throw new Error(`No commission tier found for amount: ${grossAmount}`);
        }
        const platformFeePercentage = new library_1.Decimal(tier.rate);
        const platformFee = grossAmount.mul(platformFeePercentage);
        const processorFeePercentage = new library_1.Decimal(this.PROCESSOR_FEE.percentage);
        const processorFeeFixed = new library_1.Decimal(this.PROCESSOR_FEE.fixed);
        const processorFee = grossAmount
            .mul(processorFeePercentage)
            .add(processorFeeFixed);
        const netAmount = grossAmount.sub(platformFee).sub(processorFee);
        const verificationSum = netAmount.add(platformFee).add(processorFee);
        if (!verificationSum.equals(grossAmount)) {
            throw new Error(`Commission calculation error: ${netAmount} + ${platformFee} + ${processorFee} != ${grossAmount}`);
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
    async createCommissionRecord(params) {
        const existing = await this.prisma.commissionRecord.findUnique({
            where: { transaction_id: params.transactionId }
        });
        if (existing) {
            this.logger.log(`Commission record already exists for transaction ${params.transactionId}`);
            return existing;
        }
        const calculation = this.calculateCommission(params);
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
        this.logger.log(`Created commission record for transaction ${params.transactionId}: ` +
            `gross ${calculation.grossAmount}, platform ${calculation.platformFee}, ` +
            `processor ${calculation.processorFee}, net ${calculation.netAmount}`);
        return record;
    }
    async getCommissionRecord(transactionId) {
        return this.prisma.commissionRecord.findUnique({
            where: { transaction_id: transactionId }
        });
    }
    async verifyCommissionRecord(transactionId) {
        const record = await this.getCommissionRecord(transactionId);
        if (!record) {
            throw new Error(`Commission record not found: ${transactionId}`);
        }
        const transactionType = (record.calculation_metadata || {}).transactionType;
        const recalculated = this.calculateCommission({
            grossAmount: record.gross_amount,
            currency: record.currency,
            transactionType
        });
        const valid = record.net_amount.equals(recalculated.netAmount);
        if (!valid) {
            this.logger.error(`Commission verification failed for transaction ${transactionId}: ` +
                `expected ${recalculated.netAmount}, actual ${record.net_amount}`);
        }
        return {
            valid,
            expected: recalculated.netAmount,
            actual: record.net_amount
        };
    }
    getCommissionBreakdown(grossAmount, currency, transactionType) {
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
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = CommissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommissionService);
//# sourceMappingURL=commission.service.js.map