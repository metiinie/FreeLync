import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Listing, Prisma, ListingStatus } from '@prisma/client';

@Injectable()
export class ListingsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: any, user?: any) {
        const { category, type, minPrice, maxPrice, city, search, status, owner_id, page = 1, limit = 12 } = filters;
        const skip = (page - 1) * limit;

        const conditions: Prisma.ListingWhereInput[] = [];

        // 1. Status & Visibility Filters
        if (user?.role === 'admin') {
            if (status && status !== 'all') {
                conditions.push({ status: status as ListingStatus });
            }
        } else {
            // Public & Regular User View
            conditions.push({ is_active: true });
            // Show new listings immediately (pending/approved) but hide rejected/sold/rented
            conditions.push({
                status: {
                    notIn: [ListingStatus.rejected, ListingStatus.inactive, ListingStatus.sold, ListingStatus.rented],
                }
            });
        }

        // 2. Fundamental Filters
        if (category && category !== 'all') {
            conditions.push({ category: category as any });
        }
        if (type) {
            conditions.push({ type: type as any });
        }
        if (owner_id) {
            conditions.push({ owner_id });
        }

        // 3. Price Filters
        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.gte = parseFloat(minPrice);
            if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
            conditions.push({ price: priceFilter });
        }

        // 4. Location Search (City/Subcity/Address)
        if (city && city.trim() !== '') {
            const cityTerm = city.trim();
            conditions.push({
                OR: [
                    { location: { path: ['city'], string_contains: cityTerm } as any },
                    { location: { path: ['subcity'], string_contains: cityTerm } as any },
                    { location: { path: ['address'], string_contains: cityTerm } as any },
                ]
            });
        }

        // 5. Keyword Search
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

        const where: Prisma.ListingWhereInput = conditions.length > 0 ? { AND: conditions } : {};

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

    async findOne(id: string) {
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

        if (!listing) throw new NotFoundException('Listing not found');
        return { data: listing, success: true };
    }

    async create(data: any, ownerId: string) {
        const listing = await this.prisma.listing.create({
            data: {
                ...data,
                owner_id: ownerId,
                status: ListingStatus.approved,
                verified: true,
                is_active: true,
            },
        });
        return { data: listing, success: true };
    }

    async updateStatus(id: string, status: string, notes?: string) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');

        const updated = await this.prisma.listing.update({
            where: { id },
            data: {
                status: status as any,
                verified: status === 'approved',
                verification_notes: notes,
            },
        });

        // Optionally send notification here

        return { data: updated, success: true };
    }

    async update(id: string, data: any, ownerId: string, isAdmin = false) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');

        // Only owner or admin can update
        if (listing.owner_id !== ownerId && !isAdmin) {
            throw new Error('Unauthorized');
        }

        const updated = await this.prisma.listing.update({
            where: { id },
            data,
        });
        return { data: updated, success: true };
    }

    async remove(id: string, ownerId: string, isAdmin = false) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');

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
}
