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
var LedgerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const crypto_1 = require("crypto");
let LedgerService = LedgerService_1 = class LedgerService {
    prisma;
    auditService;
    logger = new common_1.Logger(LedgerService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createEntry(params, tx) {
        const prismaClient = tx || this.prisma;
        try {
            const sellerBalance = await prismaClient.sellerBalance.findUniqueOrThrow({
                where: { id: params.sellerBalanceId }
            });
            const lastEntry = await prismaClient.ledgerEntry.findFirst({
                where: { seller_balance_id: params.sellerBalanceId },
                orderBy: { sequence: 'desc' }
            });
            let sequence = 1;
            let previousHash = 'GENESIS_HASH';
            let balanceBefore = new library_1.Decimal(0);
            if (lastEntry) {
                const last = lastEntry;
                sequence = (last.sequence || 0) + 1;
                previousHash = last.hash || 'GENESIS_HASH';
                balanceBefore = last.balance_after;
                if (last.balance_after)
                    balanceBefore = last.balance_after;
            }
            const snapshotBalance = sellerBalance.available_balance.add(sellerBalance.pending_balance);
            if (!snapshotBalance.equals(balanceBefore)) {
                const errorMsg = `CRITICAL LEDGER CORRUPTION: Snapshot (${snapshotBalance}) != Ledger History (${balanceBefore})`;
                this.logger.error(errorMsg);
                throw new Error(errorMsg);
            }
            let balanceAfter;
            if (params.type === client_1.LedgerEntryType.CREDIT) {
                balanceAfter = balanceBefore.add(params.amount);
            }
            else if (params.type === client_1.LedgerEntryType.DEBIT) {
                balanceAfter = balanceBefore.sub(params.amount);
            }
            else {
                balanceAfter = balanceBefore;
            }
            const hashInput = `${previousHash}|${params.type}|${params.source}|${params.amount.toString()}|${balanceAfter.toString()}|${sequence}|${params.sellerBalanceId}`;
            const hash = (0, crypto_1.createHash)('sha256').update(hashInput).digest('hex');
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
                    sequence: sequence,
                    previous_hash: previousHash,
                    hash: hash
                }
            });
            await this.auditService.log({
                performedBy: {
                    userId: params.createdById || 'system',
                    role: 'super_admin',
                    sessionId: 'system',
                    permissions: [],
                    permissionGroups: [],
                    ip: '127.0.0.1'
                },
                action: `ledger.${params.type.toLowerCase()}`,
                resourceType: 'LedgerEntry',
                resourceId: ledgerEntry.id,
                beforeState: { balance: balanceBefore.toString(), sequence: sequence - 1 },
                afterState: { balance: balanceAfter.toString(), sequence: sequence },
                riskLevel: 'high',
                status: 'success'
            });
            this.logger.log(`Ledger append success: Seq ${sequence} for ${params.sellerBalanceId}`);
            return ledgerEntry;
        }
        catch (error) {
            this.logger.error(`Ledger append failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async verifyChainIntegrity(sellerBalanceId) {
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { seller_balance_id: sellerBalanceId },
            orderBy: { sequence: 'asc' }
        });
        if (entries.length === 0) {
            return { valid: true, lastSequence: 0 };
        }
        let previousHash = 'GENESIS_HASH';
        let expectedSequence = 1;
        let runningBalance = new library_1.Decimal(0);
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.sequence !== expectedSequence) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }
            if (entry.previous_hash !== previousHash) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }
            let expectedBalanceAfter = runningBalance;
            if (entry.type === client_1.LedgerEntryType.CREDIT)
                expectedBalanceAfter = runningBalance.add(entry.amount);
            else if (entry.type === client_1.LedgerEntryType.DEBIT)
                expectedBalanceAfter = runningBalance.sub(entry.amount);
            if (!new library_1.Decimal(entry.balance_after).equals(expectedBalanceAfter)) {
                return { valid: false, lastSequence: i, brokenChainIndex: i, discrepancy: new library_1.Decimal(entry.balance_after).sub(expectedBalanceAfter) };
            }
            const hashInput = `${previousHash}|${entry.type}|${entry.source}|${entry.amount.toString()}|${entry.balance_after.toString()}|${entry.sequence}|${entry.seller_balance_id}`;
            const expectedHash = (0, crypto_1.createHash)('sha256').update(hashInput).digest('hex');
            if (entry.hash !== expectedHash) {
                return { valid: false, lastSequence: i, brokenChainIndex: i };
            }
            previousHash = entry.hash;
            runningBalance = expectedBalanceAfter;
            expectedSequence++;
        }
        return { valid: true, lastSequence: expectedSequence - 1 };
    }
    async calculateBalanceFromLedger(sellerBalanceId) {
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { seller_balance_id: sellerBalanceId },
            select: { type: true, amount: true }
        });
        let credits = new library_1.Decimal(0);
        let debits = new library_1.Decimal(0);
        for (const entry of entries) {
            if (entry.type === client_1.LedgerEntryType.CREDIT)
                credits = credits.add(entry.amount);
            else if (entry.type === client_1.LedgerEntryType.DEBIT)
                debits = debits.add(entry.amount);
        }
        return { credits, debits, balance: credits.sub(debits) };
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = LedgerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map