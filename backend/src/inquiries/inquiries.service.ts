import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InquiriesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any, userId: string) {
        return this.prisma.inquiry.create({
            data: {
                ...data,
                user_id: userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.inquiry.findMany({
            where: { user_id: userId },
            include: { listing: true },
        });
    }
}
