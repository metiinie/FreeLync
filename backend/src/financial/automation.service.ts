import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutService } from './payout.service';
import { ReconciliationService } from './reconciliation.service';
import { Decimal } from '@prisma/client/runtime/library';

interface WorkflowContext {
    trigger: 'SCHEDULED' | 'EVENT';
    resourceId?: string;
    dryRun?: boolean;
}

interface Violation {
    rule: string;
    details: any;
}

@Injectable()
export class FinancialAutomationService {
    private readonly logger = new Logger(FinancialAutomationService.name);
    private automationEnabled = false; // Kill Switch (Default OFF)

    // Rate Limits
    private hourlyPayoutApprovalCount = 0;
    private hourlyPayoutApprovalLimit = 10; // Max 10 auto-approvals/hour
    private hourlyPayoutApprovalVolume = new Decimal(0);
    private hourlyPayoutVolumeLimit = new Decimal(5000); // Max 5000 ETB/hour

    constructor(
        private readonly prisma: PrismaService,
        private readonly payoutService: PayoutService,
        private readonly reconciliationService: ReconciliationService
    ) {
        // Reset limits hourly
        setInterval(() => {
            this.hourlyPayoutApprovalCount = 0;
            this.hourlyPayoutApprovalVolume = new Decimal(0);
        }, 3600000);
    }

    enableAutomation(enable: boolean) {
        this.automationEnabled = enable;
        this.logger.warn(`Automation Enabled: ${enable}`);
    }

    /**
     * Run "Auto-Approve Low Value Payouts" Workflow
     * Dry-Run by default. Logs intent.
     */
    async runAutoApprovePayouts(context: WorkflowContext) {
        this.logger.log(`Running Auto-Approve Workflow [DryRun=${context.dryRun}]`);

        // 1. Fetch Candidates (PENDING, < 1000 ETB)
        const candidates = await this.prisma.payoutRequest.findMany({
            where: {
                status: 'PENDING',
                amount: { lte: 1000 }
            },
            take: 50 // Bulk Limit
        });

        for (const payout of candidates) {
            // 2. Safety Checks (Reconciliation First)
            const reconciliation = await this.reconciliationService.reconcileBalance(payout.seller_balance_id);

            if (reconciliation.status === 'MISMATCH') {
                this.logger.error(`Skipping Auto-Approve for ${payout.id}: Reconciliation Failed`);
                continue;
            }

            // 3. Rate Limit Check
            if (this.hourlyPayoutApprovalCount >= this.hourlyPayoutApprovalLimit) {
                this.logger.warn("Hourly Approval Count Limit Reached. Pausing.");
                break;
            }
            if (this.hourlyPayoutApprovalVolume.add(payout.amount).greaterThan(this.hourlyPayoutVolumeLimit)) {
                this.logger.warn("Hourly Volume Limit Reached. Pausing.");
                break;
            }

            // 4. Execute / Simulate
            if (context.dryRun || !this.automationEnabled) {
                this.logger.log(`[DRY RUN] Would verify & approve payout ${payout.id} for ${payout.amount}`);
            } else {
                try {
                    await this.payoutService.approvePayout({
                        payoutRequestId: payout.id,
                        adminId: 'auto_bot',
                        adminContext: { userId: 'auto_bot', role: 'SYSTEM' }
                    });

                    // Update Limits
                    this.hourlyPayoutApprovalCount++;
                    this.hourlyPayoutApprovalVolume = this.hourlyPayoutApprovalVolume.add(payout.amount);

                    this.logger.log(`Auto-Approved payout ${payout.id}`);
                } catch (e) {
                    this.logger.error(`Auto-Approve failed for ${payout.id}`, e);
                }
            }
        }
    }

    /**
     * Run "Flag Suspicious Accounts" Workflow
     * Detects rapid withdrawals or high velocity.
     */
    async runSuspiciousActivityScan(context: WorkflowContext) {
        // Example: Users with > 5 payouts in 1 hour
        // For now, just log hypothetical logic.
        this.logger.log(`[DRY RUN] Scanning for suspicious activity...`);
    }
}
