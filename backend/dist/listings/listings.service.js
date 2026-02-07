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
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ListingsService = class ListingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters, user) {
        const { category, type, minPrice, maxPrice, city, search, status, page = 1, limit = 12 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (user?.role === 'admin') {
            if (status && status !== 'all') {
                where.status = status;
            }
        }
        else {
            where.is_active = true;
            where.status = { not: 'rejected' };
        }
        if (category)
            where.category = category;
        if (type)
            where.type = type;
        if (minPrice)
            where.price = { gte: parseFloat(minPrice) };
        if (maxPrice)
            where.price = { lte: parseFloat(maxPrice) };
        if (city) {
            where.location = {
                path: ['city'],
                equals: city,
            };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                include: {
                    owner: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            phone: true,
                            verified: true,
                            avatar_url: true,
                            rating: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit),
            }),
            this.prisma.listing.count({ where }),
        ]);
        return { data, total, success: true };
    }
    async findOne(id) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone: true,
                        verified: true,
                        avatar_url: true,
                        rating: true,
                    },
                },
            },
        });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        return { data: listing, success: true };
    }
    async create(data, ownerId) {
        const listing = await this.prisma.listing.create({
            data: {
                ...data,
                owner_id: ownerId,
                status: 'approved',
                verified: true,
                is_active: true,
            },
        });
        return { data: listing, success: true };
    }
    async updateStatus(id, status, notes) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        const updated = await this.prisma.listing.update({
            where: { id },
            data: {
                status: status,
                verified: status === 'approved',
                verification_notes: notes,
            },
        });
        return { data: updated, success: true };
    }
    async update(id, data, ownerId, isAdmin = false) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        if (listing.owner_id !== ownerId && !isAdmin) {
            throw new Error('Unauthorized');
        }
        const updated = await this.prisma.listing.update({
            where: { id },
            data,
        });
        return { data: updated, success: true };
    }
    async remove(id, ownerId, isAdmin = false) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        if (listing.owner_id !== ownerId && !isAdmin) {
            throw new Error('Unauthorized');
        }
        await this.prisma.listing.delete({ where: { id } });
        return { success: true, message: 'Listing deleted' };
    }
    async getStats() {
        const [total, averagePriceResult] = await Promise.all([
            this.prisma.listing.count(),
            this.prisma.listing.aggregate({
                _avg: { price: true }
            })
        ]);
        return {
            success: true,
            data: {
                total,
                averagePrice: averagePriceResult._avg.price || 0
            }
        };
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map