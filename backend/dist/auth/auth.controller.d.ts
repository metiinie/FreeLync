import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
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
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
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
        };
        token: string;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
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
