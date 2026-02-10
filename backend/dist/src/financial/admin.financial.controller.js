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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminFinancialController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinancialController = void 0;
const common_1 = require("@nestjs/common");
const payout_service_1 = require("./payout.service");
const balance_service_1 = require("./balance.service");
const ledger_service_1 = require("./ledger.service");
const reconciliation_service_1 = require("./reconciliation.service");
const analytics_service_1 = require("./analytics.service");
const automation_service_1 = require("./automation.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminFinancialController = AdminFinancialController_1 = class AdminFinancialController {
    payoutService;
    balanceService;
    ledgerService;
    reconciliationService;
    analyticsService;
    automationService;
    prisma;
    logger = new common_1.Logger(AdminFinancialController_1.name);
    constructor(payoutService, balanceService, ledgerService, reconciliationService, analyticsService, automationService, prisma) {
        this.payoutService = payoutService;
        this.balanceService = balanceService;
        this.ledgerService = ledgerService;
        this.reconciliationService = reconciliationService;
        this.analyticsService = analyticsService;
        this.automationService = automationService;
        this.prisma = prisma;
    }
    async getAllBalances(page = '1', limit = '20') {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
            this.prisma.sellerBalance.findMany({
                skip,
                take: parseInt(limit),
                include: { user: { select: { email: true, full_name: true } } },
                orderBy: { available_balance: 'desc' },
            }),
            this.prisma.sellerBalance.count(),
        ]);
        return { data, total, page: parseInt(page), limit: parseInt(limit) };
    }
    async getLedgerHistory(balanceId, page = '1', limit = '50') {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
            this.prisma.ledgerEntry.findMany({
                where: { seller_balance_id: balanceId },
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.ledgerEntry.count({ where: { seller_balance_id: balanceId } }),
        ]);
        return { data, total };
    }
    async getPayouts(status, page = '1', limit = '20') {
        const where = status ? { status } : {};
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
            this.prisma.payoutRequest.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: { seller: { select: { email: true } }, seller_balance: true },
                orderBy: { requested_at: 'desc' },
            }),
            this.prisma.payoutRequest.count({ where }),
        ]);
        return { data, total };
    }
    async approvePayout(id, req) {
        const adminId = req.user?.id || 'admin_sys_fallback';
        return this.payoutService.approvePayout({
            payoutRequestId: id,
            adminId,
            adminContext: { userId: adminId, role: 'ADMIN' },
        });
    }
    async rejectPayout(id, reason, req) {
        if (!reason)
            throw new common_1.HttpException('Rejection reason required', common_1.HttpStatus.BAD_REQUEST);
        const adminId = req.user?.id || 'admin_sys_fallback';
        return this.payoutService.rejectPayout({
            payoutRequestId: id,
            adminId,
            rejectionReason: reason,
            adminContext: { userId: adminId, role: 'ADMIN' },
        });
    }
    async processPayout(id) {
        return this.payoutService.processPayout(id);
    }
    async runSystemWideReconciliation() {
        return this.reconciliationService.runSystemWideReconciliation();
    }
    async checkReconciliation(balanceId) {
        return this.reconciliationService.reconcileBalance(balanceId);
    }
    async simulateCorruption(balanceId, amount) {
        return this.reconciliationService.simulateCorruption(balanceId, amount);
    }
    async getAnalyticsDashboard() {
        const [revenue, liabilities, payouts, velocity] = await Promise.all([
            this.analyticsService.getTotalRevenue(),
            this.analyticsService.getTotalLiabilities(),
            this.analyticsService.getTotalPayouts(),
            this.analyticsService.getTransactionVelocity()
        ]);
        return {
            revenue,
            liabilities,
            payouts,
            velocity,
            timestamp: new Date()
        };
    }
    async triggerAutomation(workflow, dryRun = true) {
        if (workflow === 'auto-approve-payouts') {
            await this.automationService.runAutoApprovePayouts({
                trigger: 'EVENT',
                dryRun
            });
            return { status: 'triggered', workflow, dryRun };
        }
        throw new common_1.HttpException('Unknown workflow', common_1.HttpStatus.NOT_FOUND);
    }
    enableAutomation(enabled) {
        this.automationService.enableAutomation(enabled);
        return { status: 'updated', enabled };
    }
};
exports.AdminFinancialController = AdminFinancialController;
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "getAllBalances", null);
__decorate([
    (0, common_1.Get)('ledger/:balanceId'),
    __param(0, (0, common_1.Param)('balanceId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "getLedgerHistory", null);
__decorate([
    (0, common_1.Get)('payouts'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Post)('payouts/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "approvePayout", null);
__decorate([
    (0, common_1.Post)('payouts/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "rejectPayout", null);
__decorate([
    (0, common_1.Post)('payouts/:id/process'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "processPayout", null);
__decorate([
    (0, common_1.Get)('reconciliation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "runSystemWideReconciliation", null);
__decorate([
    (0, common_1.Get)('reconciliation/:balanceId'),
    __param(0, (0, common_1.Param)('balanceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "checkReconciliation", null);
__decorate([
    (0, common_1.Post)('reconciliation/simulate-corruption/:balanceId'),
    __param(0, (0, common_1.Param)('balanceId')),
    __param(1, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "simulateCorruption", null);
__decorate([
    (0, common_1.Get)('analytics/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "getAnalyticsDashboard", null);
__decorate([
    (0, common_1.Post)('automation/trigger/:workflow'),
    __param(0, (0, common_1.Param)('workflow')),
    __param(1, (0, common_1.Body)('dryRun')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminFinancialController.prototype, "triggerAutomation", null);
__decorate([
    (0, common_1.Post)('automation/enable'),
    __param(0, (0, common_1.Body)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], AdminFinancialController.prototype, "enableAutomation", null);
exports.AdminFinancialController = AdminFinancialController = AdminFinancialController_1 = __decorate([
    (0, common_1.Controller)('admin/financial'),
    __metadata("design:paramtypes", [payout_service_1.PayoutService,
        balance_service_1.BalanceService,
        ledger_service_1.LedgerService,
        reconciliation_service_1.ReconciliationService,
        analytics_service_1.FinancialAnalyticsService,
        automation_service_1.FinancialAutomationService,
        prisma_service_1.PrismaService])
], AdminFinancialController);
//# sourceMappingURL=admin.financial.controller.js.map