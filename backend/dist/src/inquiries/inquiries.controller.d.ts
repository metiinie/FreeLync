import { InquiriesService } from './inquiries.service';
export declare class InquiriesController {
    private readonly inquiriesService;
    constructor(inquiriesService: InquiriesService);
    create(data: any, req: any): Promise<{
        id: string;
        created_at: Date;
        listing_id: string;
        message: string;
        user_id: string;
        contact: string | null;
    }>;
    findAll(req: any): Promise<({
        listing: {
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
    } & {
        id: string;
        created_at: Date;
        listing_id: string;
        message: string;
        user_id: string;
        contact: string | null;
    })[]>;
}
