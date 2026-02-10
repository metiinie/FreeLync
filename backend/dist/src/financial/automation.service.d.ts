import { PrismaService } from '../prisma/prisma.service';
import { PayoutService } from './payout.service';
import { ReconciliationService } from './reconciliation.service';
interface WorkflowContext {
    trigger: 'SCHEDULED' | 'EVENT';
    resourceId?: string;
    dryRun?: boolean;
}
export declare class FinancialAutomationService {
    private readonly prisma;
    private readonly payoutService;
    private readonly reconciliationService;
    private readonly logger;
    private automationEnabled;
    private hourlyPayoutApprovalCount;
    private hourlyPayoutApprovalLimit;
    private hourlyPayoutApprovalVolume;
    private hourlyPayoutVolumeLimit;
    constructor(prisma: PrismaService, payoutService: PayoutService, reconciliationService: ReconciliationService);
    enableAutomation(enable: boolean): void;
    runAutoApprovePayouts(context: WorkflowContext): Promise<void>;
    runSuspiciousActivityScan(context: WorkflowContext): Promise<void>;
}
export {};
