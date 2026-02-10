import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<User | null>;
    findOneById(id: string): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    findAll(options: {
        page: number;
        limit: number;
        search?: string;
        role?: string;
        verified?: boolean;
        is_active?: boolean;
    }): Promise<{
        data: {
            id: string;
            created_at: Date;
            email: string;
            full_name: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            verified: boolean;
            avatar_url: string | null;
            is_active: boolean;
        }[];
        total: number;
        success: boolean;
    }>;
    getStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            verified: number;
            active: number;
        };
    }>;
}
