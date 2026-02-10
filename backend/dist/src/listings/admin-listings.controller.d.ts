import { ListingsService } from './listings.service';
import type { AdminContextType } from '../common/middleware/admin-identity.middleware';
export declare class AdminListingsController {
    private listingsService;
    constructor(listingsService: ListingsService);
    getAllListings(admin: AdminContextType, query: any): Promise<{
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
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            created_at: Date;
            updated_at: Date;
            verified: boolean;
            is_active: boolean;
            title: string;
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
    approveListing(id: string, dto: {
        reason?: string;
        notes?: string;
    }, admin: AdminContextType): Promise<{
        data: {
            id: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            created_at: Date;
            updated_at: Date;
            verified: boolean;
            is_active: boolean;
            title: string;
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
    rejectListing(id: string, dto: {
        reason: string;
    }, admin: AdminContextType): Promise<{
        data: {
            id: string;
            description: string;
            category: import(".prisma/client").$Enums.ListingCategory;
            created_at: Date;
            updated_at: Date;
            verified: boolean;
            is_active: boolean;
            title: string;
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
    deleteListing(id: string, dto: {
        reason: string;
    }, admin: AdminContextType): Promise<{
        success: boolean;
        message: string;
    }>;
}
