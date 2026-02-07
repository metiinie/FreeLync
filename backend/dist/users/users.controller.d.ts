import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: any): Promise<{
        data: {
            id: string;
            email: string;
            full_name: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            verified: boolean;
            avatar_url: string | null;
            is_active: boolean;
            created_at: Date;
        }[];
        total: number;
        success: boolean;
    }>;
    getMe(req: any): Promise<{
        id: string;
        email: string;
        password: string;
        full_name: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        verified: boolean;
        avatar_url: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        bank_details: import("@prisma/client/runtime/library").JsonValue | null;
        rating: import("@prisma/client/runtime/library").JsonValue;
        is_active: boolean;
        last_login: Date | null;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        created_at: Date;
        updated_at: Date;
    } | null>;
    getStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            verified: number;
            active: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        password: string;
        full_name: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        verified: boolean;
        avatar_url: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        bank_details: import("@prisma/client/runtime/library").JsonValue | null;
        rating: import("@prisma/client/runtime/library").JsonValue;
        is_active: boolean;
        last_login: Date | null;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        created_at: Date;
        updated_at: Date;
    } | null>;
    update(id: string, data: any, req: any): Promise<{
        id: string;
        email: string;
        password: string;
        full_name: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        verified: boolean;
        avatar_url: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        bank_details: import("@prisma/client/runtime/library").JsonValue | null;
        rating: import("@prisma/client/runtime/library").JsonValue;
        is_active: boolean;
        last_login: Date | null;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        created_at: Date;
        updated_at: Date;
    }>;
}
