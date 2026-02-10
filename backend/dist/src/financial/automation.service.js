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
var FinancialAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const payout_service_1 = require("./payout.service");
const reconciliation_service_1 = require("./reconciliation.service");
const library_1 = require("@prisma/client/runtime/library");
let FinancialAutomationService = FinancialAutomationService_1 = class FinancialAutomationService {
    prisma;
    payoutService;
    reconciliationService;
    logger = new common_1.Logger(FinancialAutomationService_1.name);
    automationEnabled = false;
    hourlyPayoutApprovalCount = 0;
    hourlyPayoutApprovalLimit = 10;
    hourlyPayoutApprovalVolume = new library_1.Decimal(0);
    hourlyPayoutVolumeLimit = new library_1.Decimal(5000);
    constructor(prisma, payoutService, reconciliationService) {
        this.prisma = prisma;
        this.payoutService = payoutService;
        this.reconciliationService = reconciliationService;
        setInterval(() => {
            this.hourlyPayoutApprovalCount = 0;
            this.hourlyPayoutApprovalVolume = new library_1.Decimal(0);
        }, 3600000);
    }
    enableAutomation(enable) {
        this.automationEnabled = enable;
        this.logger.warn(`Automation Enabled: ${enable}`);
    }
    async runAutoApprovePayouts(context) {
        this.logger.log(`Running Auto-Approve Workflow [DryRun=${context.dryRun}]`);
        const candidates = await this.prisma.payoutRequest.findMany({
            where: {
                status: 'PENDING',
                amount: { lte: 1000 }
            },
            take: 50
        });
        for (const payout of candidates) {
            const reconciliation = await this.reconciliationService.reconcileBalance(payout.seller_balance_id);
            if (reconciliation.status === 'MISMATCH') {
                this.logger.error(`Skipping Auto-Approve for ${payout.id}: Reconciliation Failed`);
                continue;
            }
            if (this.hourlyPayoutApprovalCount >= this.hourlyPayoutApprovalLimit) {
                this.logger.warn("Hourly Approval Count Limit Reached. Pausing.");
                break;
            }
            if (this.hourlyPayoutApprovalVolume.add(payout.amount).greaterThan(this.hourlyPayoutVolumeLimit)) {
                this.logger.warn("Hourly Volume Limit Reached. Pausing.");
                break;
            }
            if (context.dryRun || !this.automationEnabled) {
                this.logger.log(`[DRY RUN] Would verify & approve payout ${payout.id} for ${payout.amount}`);
            }
            else {
                try {
                    await this.payoutService.approvePayout({
                        payoutRequestId: payout.id,
                        adminId: 'auto_bot',
                        adminContext: { userId: 'auto_bot', role: 'SYSTEM' }
                    });
                    this.hourlyPayoutApprovalCount++;
                    this.hourlyPayoutApprovalVolume = this.hourlyPayoutApprovalVolume.add(payout.amount);
                    this.logger.log(`Auto-Approved payout ${payout.id}`);
                }
                catch (e) {
                    this.logger.error(`Auto-Approve failed for ${payout.id}`, e);
                }
            }
        }
    }
    async runSuspiciousActivityScan(context) {
        this.logger.log(`[DRY RUN] Scanning for suspicious activity...`);
    }
};
exports.FinancialAutomationService = FinancialAutomationService;
exports.FinancialAutomationService = FinancialAutomationService = FinancialAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payout_service_1.PayoutService,
        reconciliation_service_1.ReconciliationService])
], FinancialAutomationService);
//# sourceMappingURL=automation.service.js.map