import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }

    async create(data: any, userId: string) {
        return this.prisma.notification.create({
            data: {
                ...data,
                user_id: userId,
            },
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true, read_at: new Date() },
        });
    }

    async delete(id: string, userId: string) {
        return this.prisma.notification.delete({ where: { id } });
    }
}
