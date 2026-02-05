import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Listing, Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: any) {
        const { category, type, minPrice, maxPrice, city, search, page = 1, limit = 12 } = filters;
        const skip = (page - 1) * limit;

        const where: Prisma.ListingWhereInput = {
            status: 'approved',
            verified: true,
            is_active: true,
        };

        if (category) where.category = category;
        if (type) where.type = type;
        if (minPrice) where.price = { ...where.price as object, gte: parseFloat(minPrice) };
        if (maxPrice) where.price = { ...where.price as object, lte: parseFloat(maxPrice) };

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
                status: 'pending',
                verified: false,
            },
        });
        return { data: listing, success: true };
    }

    async update(id: string, data: any, ownerId: string) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.owner_id !== ownerId) throw new Error('Unauthorized');

        const updated = await this.prisma.listing.update({
            where: { id },
            data,
        });
        return { data: updated, success: true };
    }

    async remove(id: string, ownerId: string) {
        const listing = await this.prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.owner_id !== ownerId) throw new Error('Unauthorized');

        await this.prisma.listing.delete({ where: { id } });
        return { success: true, message: 'Listing deleted' };
    }
}
