import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string, role: string) {
        const where: any = {};
        if (role === 'admin') {
            // Admins see all
        } else if (role === 'seller') {
            where.seller_id = userId;
        } else {
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

    async findOne(id: string, userId: string, role: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                listing: true,
                buyer: true,
                seller: true,
            },
        });

        if (!transaction) throw new NotFoundException('Transaction not found');

        if (role !== 'admin' && transaction.buyer_id !== userId && transaction.seller_id !== userId) {
            throw new Error('Unauthorized');
        }

        return transaction;
    }

    async create(data: any, buyerId: string) {
        // Basic implementation - in a real app, you'd validate listing exists, etc.
        return this.prisma.transaction.create({
            data: {
                ...data,
                buyer_id: buyerId,
                status: 'pending',
            },
        });
    }

    async updateStatus(id: string, status: any) {
        return this.prisma.transaction.update({
            where: { id },
            data: { status },
        });
    }
}
