import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async findAll(options: {
        page: number;
        limit: number;
        search?: string;
        role?: string;
        verified?: boolean;
        is_active?: boolean;
    }) {
        const { page, limit, search, role, verified, is_active } = options;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};
        if (role) where.role = role as any;
        if (verified !== undefined) where.verified = verified;
        if (is_active !== undefined) where.is_active = is_active;
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    phone: true,
                    role: true,
                    verified: true,
                    avatar_url: true,
                    is_active: true,
                    created_at: true,
                }
            }),
            this.prisma.user.count({ where }),
        ]);

        return { data, total, success: true };
    }

    async getStats() {
        const [total, verified, active] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { verified: true } }),
            this.prisma.user.count({ where: { is_active: true } }),
        ]);

        return {
            success: true,
            data: { total, verified, active }
        };
    }
}
