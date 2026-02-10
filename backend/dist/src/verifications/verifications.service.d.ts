import { PrismaService } from '../prisma/prisma.service';
import { VerificationDocumentStatus, VerificationScope } from '@prisma/client';
import { CreateVerificationRequestDto } from './dto/create-request.dto';
import { SubmitDocumentDto } from './dto/submit-document.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../notifications/notifications.service';
export declare class VerificationsService {
    private prisma;
    private auditService;
    private notificationService;
    constructor(prisma: PrismaService, auditService: AuditService, notificationService: NotificationService);
    createRequest(userId: string, dto: CreateVerificationRequestDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        expires_at: Date | null;
        listing_id: string | null;
        user_id: string;
        admin_notes: string | null;
        transaction_id: string | null;
        assigned_admin_id: string | null;
        scope: import(".prisma/client").$Enums.VerificationScope;
        rejection_reason: string | null;
        confidence_score: number | null;
        last_review_at: Date | null;
    }>;
    submitDocument(userId: string, requestId: string, dto: SubmitDocumentDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationDocumentStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        request_id: string;
        file_url: string;
        file_type: string;
        uploader_id: string;
        rejection_reason: string | null;
        file_name: string;
        file_size: number;
        confidence_signal: number | null;
        issue_date: Date | null;
        expiry_date: Date | null;
        type_id: string;
    }>;
    getMyRequests(userId: string): Promise<({
        documents: ({
            type: {
                id: string;
                name: string;
                description: string | null;
                scope: import(".prisma/client").$Enums.VerificationScope;
                code: string;
                required: boolean;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            status: import(".prisma/client").$Enums.VerificationDocumentStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            request_id: string;
            file_url: string;
            file_type: string;
            uploader_id: string;
            rejection_reason: string | null;
            file_name: string;
            file_size: number;
            confidence_signal: number | null;
            issue_date: Date | null;
            expiry_date: Date | null;
            type_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        expires_at: Date | null;
        listing_id: string | null;
        user_id: string;
        admin_notes: string | null;
        transaction_id: string | null;
        assigned_admin_id: string | null;
        scope: import(".prisma/client").$Enums.VerificationScope;
        rejection_reason: string | null;
        confidence_score: number | null;
        last_review_at: Date | null;
    })[]>;
    findAllForAdmin(filters: any): Promise<({
        user: {
            email: string;
            full_name: string;
        };
        listing: {
            title: string;
        } | null;
        documents: ({
            type: {
                id: string;
                name: string;
                description: string | null;
                scope: import(".prisma/client").$Enums.VerificationScope;
                code: string;
                required: boolean;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            status: import(".prisma/client").$Enums.VerificationDocumentStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            request_id: string;
            file_url: string;
            file_type: string;
            uploader_id: string;
            rejection_reason: string | null;
            file_name: string;
            file_size: number;
            confidence_signal: number | null;
            issue_date: Date | null;
            expiry_date: Date | null;
            type_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        expires_at: Date | null;
        listing_id: string | null;
        user_id: string;
        admin_notes: string | null;
        transaction_id: string | null;
        assigned_admin_id: string | null;
        scope: import(".prisma/client").$Enums.VerificationScope;
        rejection_reason: string | null;
        confidence_score: number | null;
        last_review_at: Date | null;
    })[]>;
    reviewRequest(requestId: string, adminId: string, dto: ReviewRequestDto, adminContext: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationRequestStatus;
        expires_at: Date | null;
        listing_id: string | null;
        user_id: string;
        admin_notes: string | null;
        transaction_id: string | null;
        assigned_admin_id: string | null;
        scope: import(".prisma/client").$Enums.VerificationScope;
        rejection_reason: string | null;
        confidence_score: number | null;
        last_review_at: Date | null;
    }>;
    reviewDocument(docId: string, status: VerificationDocumentStatus, adminId: string, reason?: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.VerificationDocumentStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        request_id: string;
        file_url: string;
        file_type: string;
        uploader_id: string;
        rejection_reason: string | null;
        file_name: string;
        file_size: number;
        confidence_signal: number | null;
        issue_date: Date | null;
        expiry_date: Date | null;
        type_id: string;
    }>;
    getDocumentTypes(scope?: VerificationScope): Promise<{
        id: string;
        name: string;
        description: string | null;
        scope: import(".prisma/client").$Enums.VerificationScope;
        code: string;
        required: boolean;
    }[]>;
}
