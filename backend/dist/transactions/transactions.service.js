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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, role) {
        const where = {};
        if (role === 'admin') {
        }
        else if (role === 'seller') {
            where.seller_id = userId;
        }
        else {
            where.buyer_id = userId;
        }
        return this.prisma.transaction.findMany({
            where,
            include: {
                listing: true,
                buyer: {
                    select: { full_name: true, email: true },
                },
                seller: {
                    select: { full_name: true, email: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async findOne(id, userId, role) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                listing: true,
                buyer: true,
                seller: true,
            },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        if (role !== 'admin' && transaction.buyer_id !== userId && transaction.seller_id !== userId) {
            throw new Error('Unauthorized');
        }
        return transaction;
    }
    async create(data, buyerId) {
        return this.prisma.transaction.create({
            data: {
                ...data,
                buyer_id: buyerId,
                status: 'pending',
            },
        });
    }
    async updateStatus(id, status) {
        return this.prisma.transaction.update({
            where: { id },
            data: { status },
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map