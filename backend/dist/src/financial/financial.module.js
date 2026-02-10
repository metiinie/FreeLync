"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialModule = void 0;
const common_1 = require("@nestjs/common");
const ledger_service_1 = require("./ledger.service");
const commission_service_1 = require("./commission.service");
const balance_service_1 = require("./balance.service");
const financial_orchestrator_service_1 = require("./financial.orchestrator.service");
const payout_service_1 = require("./payout.service");
const reconciliation_service_1 = require("./reconciliation.service");
const analytics_service_1 = require("./analytics.service");
const automation_service_1 = require("./automation.service");
const admin_financial_controller_1 = require("./admin.financial.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const payment_module_1 = require("../payment/payment.module");
let FinancialModule = class FinancialModule {
};
exports.FinancialModule = FinancialModule;
exports.FinancialModule = FinancialModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, payment_module_1.PaymentModule],
        controllers: [admin_financial_controller_1.AdminFinancialController],
        providers: [
            ledger_service_1.LedgerService,
            commission_service_1.CommissionService,
            balance_service_1.BalanceService,
            financial_orchestrator_service_1.FinancialOrchestrationService,
            payout_service_1.PayoutService,
            reconciliation_service_1.ReconciliationService,
            analytics_service_1.FinancialAnalyticsService,
            automation_service_1.FinancialAutomationService
        ],
        exports: [
            ledger_service_1.LedgerService,
            commission_service_1.CommissionService,
            balance_service_1.BalanceService,
            financial_orchestrator_service_1.FinancialOrchestrationService,
            payout_service_1.PayoutService,
            reconciliation_service_1.ReconciliationService,
            analytics_service_1.FinancialAnalyticsService,
            automation_service_1.FinancialAutomationService
        ]
    })
], FinancialModule);
//# sourceMappingURL=financial.module.js.map