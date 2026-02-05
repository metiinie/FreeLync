import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class ListingsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters: any): Promise<{
        data: ({
            owner: {
                id: string;
                email: string;
                full_name: string;
                phone: string | null;
                verified: boolean;
                avatar_url: string | null;
                rating: Prisma.JsonValue;
            };
        } & {
            id: string;
            verified: boolean;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            subcategory: string | null;
            price: number;
            currency: string;
            type: import(".prisma/client").$Enums.ListingType;
            rent_period: string | null;
            location: Prisma.JsonValue;
            images: Prisma.JsonValue;
            documents: Prisma.JsonValue;
            features: Prisma.JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        })[];
        total: number;
        success: boolean;
    }>;
    findOne(id: string): Promise<{
        data: {
            owner: {
                id: string;
                email: string;
                full_name: string;
                phone: string | null;
                verified: boolean;
                avatar_url: string | null;
                rating: Prisma.JsonValue;
            };
        } & {
            id: string;
            verified: boolean;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            subcategory: string | null;
            price: number;
            currency: string;
            type: import(".prisma/client").$Enums.ListingType;
            rent_period: string | null;
            location: Prisma.JsonValue;
            images: Prisma.JsonValue;
            documents: Prisma.JsonValue;
            features: Prisma.JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    create(data: any, ownerId: string): Promise<{
        data: {
            id: string;
            verified: boolean;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            subcategory: string | null;
            price: number;
            currency: string;
            type: import(".prisma/client").$Enums.ListingType;
            rent_period: string | null;
            location: Prisma.JsonValue;
            images: Prisma.JsonValue;
            documents: Prisma.JsonValue;
            features: Prisma.JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    update(id: string, data: any, ownerId: string): Promise<{
        data: {
            id: string;
            verified: boolean;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            subcategory: string | null;
            price: number;
            currency: string;
            type: import(".prisma/client").$Enums.ListingType;
            rent_period: string | null;
            location: Prisma.JsonValue;
            images: Prisma.JsonValue;
            documents: Prisma.JsonValue;
            features: Prisma.JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    remove(id: string, ownerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
