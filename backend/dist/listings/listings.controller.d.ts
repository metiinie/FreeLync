import { ListingsService } from './listings.service';
export declare class ListingsController {
    private readonly listingsService;
    constructor(listingsService: ListingsService);
    findAll(query: any, req: any): Promise<{
        data: ({
            owner: {
                id: string;
                email: string;
                full_name: string;
                phone: string | null;
                verified: boolean;
                avatar_url: string | null;
                rating: import("@prisma/client/runtime/library").JsonValue;
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
            location: import("@prisma/client/runtime/library").JsonValue;
            images: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
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
    getStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            averagePrice: number;
        };
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
                rating: import("@prisma/client/runtime/library").JsonValue;
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
            location: import("@prisma/client/runtime/library").JsonValue;
            images: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    create(data: any, req: any): Promise<{
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
            location: import("@prisma/client/runtime/library").JsonValue;
            images: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    updateStatus(id: string, body: {
        status: string;
        notes?: string;
    }): Promise<{
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
            location: import("@prisma/client/runtime/library").JsonValue;
            images: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    update(id: string, data: any, req: any): Promise<{
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
            location: import("@prisma/client/runtime/library").JsonValue;
            images: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
            status: import(".prisma/client").$Enums.ListingStatus;
            verification_notes: string | null;
            views: number;
            tags: string[];
            expires_at: Date | null;
            owner_id: string;
        };
        success: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
