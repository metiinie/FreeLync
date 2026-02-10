import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CommissionService } from './commission.service';
import { BalanceService } from './balance.service';
import { FinancialOrchestrationService } from './financial.orchestrator.service';
import { PayoutService } from './payout.service';
import { ReconciliationService } from './reconciliation.service';
import { FinancialAnalyticsService } from './analytics.service';
import { FinancialAutomationService } from './automation.service';
import { AdminFinancialController } from './admin.financial.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [PrismaModule, CommonModule, PaymentModule],
    controllers: [AdminFinancialController],
    providers: [
        LedgerService,
        CommissionService,
        BalanceService,
        FinancialOrchestrationService,
        PayoutService,
        ReconciliationService,
        FinancialAnalyticsService,
        FinancialAutomationService
    ],
    exports: [
        LedgerService,
        CommissionService,
        BalanceService,
        FinancialOrchestrationService,
        PayoutService,
        ReconciliationService,
        FinancialAnalyticsService,
        FinancialAutomationService
    ]
})
export class FinancialModule { }
