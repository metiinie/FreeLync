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
var BalanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceService = exports.IdempotencyConflictError = exports.InsufficientFundsError = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("./ledger.service");
const audit_service_1 = require("../common/services/audit.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
class InsufficientFundsError extends Error {
    available;
    required;
    constructor(available, required) {
        super(`Insufficient funds: available ${available}, required ${required}`);
        this.available = available;
        this.required = required;
        this.name = 'InsufficientFundsError';
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class IdempotencyConflictError extends Error {
    key;
    constructor(key) {
        super(`Idempotency conflict: key ${key} already used`);
        this.key = key;
        this.name = 'IdempotencyConflictError';
    }
}
exports.IdempotencyConflictError = IdempotencyConflictError;
let BalanceService = BalanceService_1 = class BalanceService {
    prisma;
    ledgerService;
    auditService;
    logger = new common_1.Logger(BalanceService_1.name);
    constructor(prisma, ledgerService, auditService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.auditService = auditService;
    }
    async getOrCreateBalance(userId, tx) {
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
                    available_balance: new library_1.Decimal(0),
                    pending_balance: new library_1.Decimal(0),
                    total_earned: new library_1.Decimal(0),
                    total_withdrawn: new library_1.Decimal(0),
                    currency: 'ETB',
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                const existingRetry = await prisma.sellerBalance.findUnique({
                    where: { user_id: userId },
                });
                if (existingRetry)
                    return existingRetry;
            }
            throw error;
        }
    }
    async credit(params, tx) {
        const execute = async (txClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);
            const availableAfter = balance.available_balance.add(params.amount);
            const totalEarnedAfter = balance.total_earned.add(params.amount);
            const ledgerEntry = await this.ledgerService.createEntry({
                sellerBalanceId: balance.id,
                type: client_1.LedgerEntryType.CREDIT,
                source: params.source,
                amount: params.amount,
                description: params.description,
                transactionId: params.transactionId,
                metadata: { ...params.metadata, idempotencyKey: params.idempotencyKey },
            }, txClient);
            const updatedBalance = await txClient.sellerBalance.update({
                where: { id: balance.id },
                data: {
                    available_balance: availableAfter,
                    total_earned: totalEarnedAfter,
                },
            });
            await this.auditService.log({
                performedBy: {
                    userId: 'system',
                    role: 'super_admin',
                    sessionId: 'system',
                    permissions: [],
                    permissionGroups: [],
                    ip: '127.0.0.1'
                },
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
    async debit(params, tx) {
        const execute = async (txClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);
            let balanceType = 'available';
            if (params.source === client_1.LedgerEntrySource.PAYOUT_COMPLETED) {
                balanceType = 'pending';
            }
            const balanceBefore = balanceType === 'available' ? balance.available_balance : balance.pending_balance;
            if (balanceBefore.lessThan(params.amount)) {
                throw new InsufficientFundsError(balanceBefore, params.amount);
            }
            const balanceAfter = balanceBefore.sub(params.amount);
            const ledgerEntry = await this.ledgerService.createEntry({
                sellerBalanceId: balance.id,
                type: client_1.LedgerEntryType.DEBIT,
                source: params.source,
                amount: params.amount,
                description: params.description,
                payoutRequestId: params.payoutRequestId,
                metadata: { ...params.metadata, idempotencyKey: params.idempotencyKey, balanceType },
            }, txClient);
            const updateData = {};
            if (balanceType === 'available') {
                updateData.available_balance = balanceAfter;
            }
            else {
                updateData.pending_balance = balanceAfter;
                if (params.source === client_1.LedgerEntrySource.PAYOUT_COMPLETED) {
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
    async holdFunds(params, tx) {
        const execute = async (txClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);
            if (balance.available_balance.lessThan(params.amount)) {
                throw new InsufficientFundsError(balance.available_balance, params.amount);
            }
            const availableAfter = balance.available_balance.sub(params.amount);
            const pendingAfter = balance.pending_balance.add(params.amount);
            const ledgerEntry = await this.ledgerService.createEntry({
                sellerBalanceId: balance.id,
                type: client_1.LedgerEntryType.HOLD,
                source: client_1.LedgerEntrySource.PAYOUT_REQUESTED,
                amount: params.amount,
                description: params.reason,
                payoutRequestId: params.payoutRequestId,
                metadata: { idempotencyKey: params.idempotencyKey },
            }, txClient);
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
    async releaseHeldFunds(params, tx) {
        const execute = async (txClient) => {
            const balance = await this.getLockedBalance(txClient, params.userId);
            if (balance.pending_balance.lessThan(params.amount)) {
                throw new Error(`Cannot release ${params.amount} from pending balance ${balance.pending_balance}. Inconsistent state.`);
            }
            const pendingAfter = balance.pending_balance.sub(params.amount);
            const availableAfter = balance.available_balance.add(params.amount);
            const ledgerEntry = await this.ledgerService.createEntry({
                sellerBalanceId: balance.id,
                type: client_1.LedgerEntryType.RELEASE_HOLD,
                source: params.source,
                amount: params.amount,
                description: params.reason,
                payoutRequestId: params.payoutRequestId,
                metadata: { idempotencyKey: params.idempotencyKey },
            }, txClient);
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
    async verifyBalance(userId) {
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
    async getLockedBalance(tx, userId) {
        await tx.$executeRaw `SELECT 1 FROM "seller_balances" WHERE "user_id" = ${userId} FOR UPDATE`;
        const balance = await tx.sellerBalance.findUnique({
            where: { user_id: userId },
        });
        if (!balance) {
            throw new Error(`Seller balance not found for user ${userId}`);
        }
        return balance;
    }
};
exports.BalanceService = BalanceService;
exports.BalanceService = BalanceService = BalanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_service_1.AuditService])
], BalanceService);
//# sourceMappingURL=balance.service.js.map