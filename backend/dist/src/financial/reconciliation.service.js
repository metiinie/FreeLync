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
var ReconciliationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("./ledger.service");
const balance_service_1 = require("./balance.service");
const library_1 = require("@prisma/client/runtime/library");
let ReconciliationService = ReconciliationService_1 = class ReconciliationService {
    prisma;
    ledgerService;
    balanceService;
    logger = new common_1.Logger(ReconciliationService_1.name);
    constructor(prisma, ledgerService, balanceService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.balanceService = balanceService;
    }
    async reconcileBalance(sellerBalanceId) {
        const balance = await this.prisma.sellerBalance.findUniqueOrThrow({
            where: { id: sellerBalanceId },
        });
        const ledgerCalc = await this.ledgerService.calculateBalanceFromLedger(sellerBalanceId);
        const snapshotTotal = balance.available_balance.add(balance.pending_balance);
        const totalDiscrepancy = snapshotTotal.sub(ledgerCalc.balance);
        const pendingPayouts = await this.prisma.payoutRequest.findMany({
            where: { seller_balance_id: sellerBalanceId, status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } }
        });
        const calculatedPending = pendingPayouts.reduce((sum, p) => sum.add(p.amount), new library_1.Decimal(0));
        const pendingDiscrepancy = balance.pending_balance.sub(calculatedPending);
        const report = {
            balanceId: sellerBalanceId,
            timestamp: new Date(),
            status: totalDiscrepancy.equals(0) && pendingDiscrepancy.equals(0) ? 'MATCH' : 'MISMATCH',
            snapshot: {
                available: balance.available_balance,
                pending: balance.pending_balance,
                total: snapshotTotal,
            },
            ledger: {
                credits: ledgerCalc.credits,
                debits: ledgerCalc.debits,
                calculatedTotal: ledgerCalc.balance,
            },
            discrepancy: totalDiscrepancy,
            payouts: {
                totalPending: calculatedPending,
                ledgerPendingDetails: balance.pending_balance,
                status: pendingDiscrepancy.equals(0) ? 'MATCH' : 'MISMATCH'
            }
        };
        if (report.status === 'MISMATCH') {
            this.logger.error(`CRITICAL: Reconciliation Mismatch for ${sellerBalanceId}`, report);
        }
        else {
            this.logger.log(`Reconciliation Passed for ${sellerBalanceId}`);
        }
        return report;
    }
    async simulateCorruption(sellerBalanceId, amount) {
        this.logger.warn(`SIMULATING CORRUPTION on ${sellerBalanceId} by ${amount}`);
        await this.prisma.$executeRaw `
        UPDATE "seller_balances" 
        SET "available_balance" = "available_balance" + ${amount} 
        WHERE "id" = ${sellerBalanceId}
     `;
        return this.reconcileBalance(sellerBalanceId);
    }
    async runSystemWideReconciliation() {
        this.logger.log("Starting System-Wide Reconciliation...");
        const balances = await this.prisma.sellerBalance.findMany({ select: { id: true } });
        const results = [];
        for (const b of balances) {
            try {
                results.push(await this.reconcileBalance(b.id));
            }
            catch (e) {
                this.logger.error(`Failed to reconcile ${b.id}`, e);
            }
        }
        const failures = results.filter(r => r.status === 'MISMATCH');
        this.logger.log(`System Reconciliation Complete. Checked: ${results.length}. Failures: ${failures.length}`);
        return { total: results.length, failures };
    }
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = ReconciliationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        balance_service_1.BalanceService])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map