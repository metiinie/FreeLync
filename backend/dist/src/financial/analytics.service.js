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
var FinancialAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let FinancialAnalyticsService = FinancialAnalyticsService_1 = class FinancialAnalyticsService {
    prisma;
    logger = new common_1.Logger(FinancialAnalyticsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTotalRevenue(currency = 'ETB') {
        const aggregate = await this.prisma.commissionRecord.aggregate({
            _sum: { platform_fee: true },
            where: { currency },
        });
        return aggregate._sum?.platform_fee || new library_1.Decimal(0);
    }
    async getTotalLiabilities(currency = 'ETB') {
        const aggregate = await this.prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: {
                currency,
                type: { in: ['CREDIT', 'DEBIT'] }
            }
        });
        const result = await this.prisma.$queryRaw `
      SELECT 
        SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END) as liabilities
      FROM "ledger_entries"
      WHERE currency = ${currency}
      AND type IN ('CREDIT', 'DEBIT')
    `;
        return result[0]?.liabilities || new library_1.Decimal(0);
    }
    async getTotalPayouts(currency = 'ETB') {
        const aggregate = await this.prisma.payoutRequest.aggregate({
            _sum: { amount: true },
            where: {
                currency,
                status: 'COMPLETED'
            }
        });
        return aggregate._sum?.amount || new library_1.Decimal(0);
    }
    async getTransactionVelocity(hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.prisma.transaction.count({
            where: { created_at: { gte: since } }
        });
    }
};
exports.FinancialAnalyticsService = FinancialAnalyticsService;
exports.FinancialAnalyticsService = FinancialAnalyticsService = FinancialAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialAnalyticsService);
//# sourceMappingURL=analytics.service.js.map