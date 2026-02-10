import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class FinancialAnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getTotalRevenue(currency?: string): Promise<Decimal>;
    getTotalLiabilities(currency?: string): Promise<Decimal>;
    getTotalPayouts(currency?: string): Promise<Decimal>;
    getTransactionVelocity(hours?: number): Promise<number>;
}
