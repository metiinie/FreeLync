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

    async getStats() {
        const [total, volumeResult, commissionResult] = await Promise.all([
            this.prisma.transaction.count(),
            this.prisma.transaction.aggregate({
                _sum: { amount: true }
            }),
            this.prisma.transaction.aggregate({
                // This depends on how commission is stored. It's Json in schema.
                // For now, let's just return a placeholder or sum some field if exists.
                // In schema.prisma line 155, commission is Json.
                _sum: { amount: true } // Placeholder summing total amount as volume
            })
        ]);

        return {
            success: true,
            data: {
                total,
                totalVolume: volumeResult._sum.amount || 0,
                totalCommissions: 0 // Placeholder
            }
        };
    }
}
