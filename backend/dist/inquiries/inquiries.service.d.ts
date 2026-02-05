import { PrismaService } from '../prisma/prisma.service';
export declare class InquiriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any, userId: string): Promise<{
        id: string;
        created_at: Date;
        listing_id: string;
        message: string;
        user_id: string;
        contact: string | null;
    }>;
    findAll(userId: string): Promise<({
        listing: {
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
    } & {
        id: string;
        created_at: Date;
        listing_id: string;
        message: string;
        user_id: string;
        contact: string | null;
    })[]>;
}
