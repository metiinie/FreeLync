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
const client_1 = require("@prisma/client");
let ListingsService = class ListingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters, user) {
        const { category, type, minPrice, maxPrice, city, search, status, owner_id, page = 1, limit = 12 } = filters;
        const skip = (page - 1) * limit;
        const conditions = [];
        if (user?.role === 'admin') {
            if (status && status !== 'all') {
                conditions.push({ status: status });
            }
        }
        else {
            conditions.push({ is_active: true });
            conditions.push({
                status: {
                    notIn: [client_1.ListingStatus.rejected, client_1.ListingStatus.inactive, client_1.ListingStatus.sold, client_1.ListingStatus.rented],
                }
            });
        }
        if (category && category !== 'all') {
            conditions.push({ category: category });
        }
        if (type) {
            conditions.push({ type: type });
        }
        if (owner_id) {
            conditions.push({ owner_id });
        }
        if (minPrice || maxPrice) {
            const priceFilter = {};
            if (minPrice)
                priceFilter.gte = parseFloat(minPrice);
            if (maxPrice)
                priceFilter.lte = parseFloat(maxPrice);
            conditions.push({ price: priceFilter });
        }
        if (city && city.trim() !== '') {
            const cityTerm = city.trim();
            conditions.push({
                OR: [
                    { location: { path: ['city'], string_contains: cityTerm } },
                    { location: { path: ['subcity'], string_contains: cityTerm } },
                    { location: { path: ['address'], string_contains: cityTerm } },
                ]
            });
        }
        if (search && search.trim() !== '') {
            const searchTerm = search.trim();
            conditions.push({
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                    { subcategory: { contains: searchTerm, mode: 'insensitive' } },
                ]
            });
        }
        const where = conditions.length > 0 ? { AND: conditions } : {};
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
                status: client_1.ListingStatus.approved,
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
    async approveListing(id, metadata) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        const updated = await this.prisma.listing.update({
            where: { id },
            data: {
                status: client_1.ListingStatus.approved,
                verified: true,
                verification_notes: metadata.notes,
            },
        });
        return { data: updated, success: true };
    }
    async rejectListing(id, metadata) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        const updated = await this.prisma.listing.update({
            where: { id },
            data: {
                status: client_1.ListingStatus.rejected,
                verification_notes: metadata.reason,
            },
        });
        return { data: updated, success: true };
    }
    async deleteListingAsAdmin(id, metadata) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing)
            throw new common_1.NotFoundException('Listing not found');
        await this.prisma.listing.delete({ where: { id } });
        return { success: true, message: 'Listing deleted by admin' };
    }
    async getAllListingsForAdmin(adminId, query = {}) {
        return this.findAll(query, { role: 'admin', userId: adminId });
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map