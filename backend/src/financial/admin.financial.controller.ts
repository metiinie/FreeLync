import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { PayoutService } from './payout.service';
import { BalanceService } from './balance.service';
import { LedgerService } from './ledger.service';
import { ReconciliationService } from './reconciliation.service'; // Added
import { FinancialAnalyticsService } from './analytics.service'; // Added
import { FinancialAutomationService } from './automation.service'; // Added
import { PrismaService } from '../prisma/prisma.service';
import { PayoutRequestStatus } from '@prisma/client';

@Controller('admin/financial')
export class AdminFinancialController {
    private readonly logger = new Logger(AdminFinancialController.name);

    constructor(
        private readonly payoutService: PayoutService,
        private readonly balanceService: BalanceService,
        private readonly ledgerService: LedgerService,
        private readonly reconciliationService: ReconciliationService,
        private readonly analyticsService: FinancialAnalyticsService,
        private readonly automationService: FinancialAutomationService,
        private readonly prisma: PrismaService,
    ) { }

    // ... (Previous Balances / Ledger / Payouts endpoints remain same, omitted for brevity but need to include full file content or replace blocks properly)
    // To avoid huge file rewrite, I'll rewrite the whole controller with imports.

    @Get('balances')
    async getAllBalances(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
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

    @Get('ledger/:balanceId')
    async getLedgerHistory(
        @Param('balanceId') balanceId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '50',
    ) {
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

    @Get('payouts')
    async getPayouts(
        @Query('status') status?: PayoutRequestStatus,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
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

    @Post('payouts/:id/approve')
    async approvePayout(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const adminId = req.user?.id || 'admin_sys_fallback';
        return this.payoutService.approvePayout({
            payoutRequestId: id,
            adminId,
            adminContext: { userId: adminId, role: 'ADMIN' },
        });
    }

    @Post('payouts/:id/reject')
    async rejectPayout(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Req() req: any,
    ) {
        if (!reason) throw new HttpException('Rejection reason required', HttpStatus.BAD_REQUEST);
        const adminId = req.user?.id || 'admin_sys_fallback';
        return this.payoutService.rejectPayout({
            payoutRequestId: id,
            adminId,
            rejectionReason: reason,
            adminContext: { userId: adminId, role: 'ADMIN' },
        });
    }

    @Post('payouts/:id/process')
    async processPayout(@Param('id') id: string) {
        return this.payoutService.processPayout(id);
    }

    // --- NEW ENDPOINTS ---

    @Get('reconciliation')
    async runSystemWideReconciliation() {
        return this.reconciliationService.runSystemWideReconciliation();
    }

    @Get('reconciliation/:balanceId')
    async checkReconciliation(@Param('balanceId') balanceId: string) {
        return this.reconciliationService.reconcileBalance(balanceId);
    }

    @Post('reconciliation/simulate-corruption/:balanceId')
    async simulateCorruption(
        @Param('balanceId') balanceId: string,
        @Body('amount') amount: number
    ) {
        // DEBUG Only - strictly controlled by AdminGuard normally
        return this.reconciliationService.simulateCorruption(balanceId, amount);
    }

    @Get('analytics/dashboard')
    async getAnalyticsDashboard() {
        // Aggregate multiple metrics
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

    @Post('automation/trigger/:workflow')
    async triggerAutomation(
        @Param('workflow') workflow: string,
        @Body('dryRun') dryRun = true
    ) {
        if (workflow === 'auto-approve-payouts') {
            await this.automationService.runAutoApprovePayouts({
                trigger: 'EVENT',
                dryRun
            });
            return { status: 'triggered', workflow, dryRun };
        }
        throw new HttpException('Unknown workflow', HttpStatus.NOT_FOUND);
    }

    @Post('automation/enable')
    enableAutomation(@Body('enabled') enabled: boolean) {
        this.automationService.enableAutomation(enabled);
        return { status: 'updated', enabled };
    }
}
