import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.favorite.findMany({
            where: { user_id: userId },
            include: { listing: true },
        });
    }

    async create(userId: string, listingId: string) {
        return this.prisma.favorite.create({
            data: {
                user_id: userId,
                listing_id: listingId,
            },
        });
    }

    async delete(userId: string, listingId: string) {
        return this.prisma.favorite.deleteMany({
            where: {
                user_id: userId,
                listing_id: listingId,
            },
        });
    }
}
