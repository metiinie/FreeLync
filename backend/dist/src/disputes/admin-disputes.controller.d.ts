import { DisputesService } from './disputes.service';
import type { AdminContextType } from '../common/middleware/admin-identity.middleware';
import type { AddMessageDto } from './dto/add-message.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';
export declare class AdminDisputesController {
    private readonly disputesService;
    constructor(disputesService: DisputesService);
    findAll(admin: AdminContextType): Promise<({
        transaction: {
            refund: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            created_at: Date;
            updated_at: Date;
            currency: string;
            status: import(".prisma/client").$Enums.TransactionStatus;
            amount: number;
            commission: import("@prisma/client/runtime/library").JsonValue;
            payment_method: import(".prisma/client").$Enums.PaymentMethod;
            payment_details: import("@prisma/client/runtime/library").JsonValue;
            escrow: import("@prisma/client/runtime/library").JsonValue;
            contract: import("@prisma/client/runtime/library").JsonValue;
            delivery: import("@prisma/client/runtime/library").JsonValue;
            dispute_data: import("@prisma/client/runtime/library").JsonValue;
            timeline: import("@prisma/client/runtime/library").JsonValue;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            listing_id: string;
            seller_id: string;
            buyer_id: string;
        };
        respondent: {
            email: string;
            full_name: string;
        };
        assigned_admin: {
            email: string;
            full_name: string;
        } | null;
        initiator: {
            email: string;
            full_name: string;
        };
    } & {
        id: string;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        reason: import(".prisma/client").$Enums.DisputeReason;
        amount_claimed: number;
        resolution: import(".prisma/client").$Enums.DisputeResolution | null;
        resolution_notes: string | null;
        resolved_at: Date | null;
        admin_notes: string | null;
        evidence_deadline: Date | null;
        resolution_deadline: Date | null;
        transaction_id: string;
        respondent_id: string;
        assigned_admin_id: string | null;
        initiator_id: string;
    })[]>;
    findOne(id: string, admin: AdminContextType): Promise<{
        transaction: {
            refund: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            created_at: Date;
            updated_at: Date;
            currency: string;
            status: import(".prisma/client").$Enums.TransactionStatus;
            amount: number;
            commission: import("@prisma/client/runtime/library").JsonValue;
            payment_method: import(".prisma/client").$Enums.PaymentMethod;
            payment_details: import("@prisma/client/runtime/library").JsonValue;
            escrow: import("@prisma/client/runtime/library").JsonValue;
            contract: import("@prisma/client/runtime/library").JsonValue;
            delivery: import("@prisma/client/runtime/library").JsonValue;
            dispute_data: import("@prisma/client/runtime/library").JsonValue;
            timeline: import("@prisma/client/runtime/library").JsonValue;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            listing_id: string;
            seller_id: string;
            buyer_id: string;
        };
        respondent: {
            email: string;
            full_name: string;
        };
        assigned_admin: {
            email: string;
            full_name: string;
        } | null;
        evidence: ({
            uploader: {
                full_name: string;
            };
        } & {
            id: string;
            description: string | null;
            created_at: Date;
            file_url: string;
            file_type: string;
            dispute_id: string;
            uploader_id: string;
        })[];
        messages: ({
            sender: {
                full_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            dispute_id: string;
            content: string;
            is_internal: boolean;
            sender_id: string;
        })[];
        initiator: {
            email: string;
            full_name: string;
        };
    } & {
        id: string;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        reason: import(".prisma/client").$Enums.DisputeReason;
        amount_claimed: number;
        resolution: import(".prisma/client").$Enums.DisputeResolution | null;
        resolution_notes: string | null;
        resolved_at: Date | null;
        admin_notes: string | null;
        evidence_deadline: Date | null;
        resolution_deadline: Date | null;
        transaction_id: string;
        respondent_id: string;
        assigned_admin_id: string | null;
        initiator_id: string;
    }>;
    assignMember(id: string, admin: AdminContextType): Promise<{
        id: string;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        reason: import(".prisma/client").$Enums.DisputeReason;
        amount_claimed: number;
        resolution: import(".prisma/client").$Enums.DisputeResolution | null;
        resolution_notes: string | null;
        resolved_at: Date | null;
        admin_notes: string | null;
        evidence_deadline: Date | null;
        resolution_deadline: Date | null;
        transaction_id: string;
        respondent_id: string;
        assigned_admin_id: string | null;
        initiator_id: string;
    }>;
    resolve(id: string, dto: ResolveDisputeDto, admin: AdminContextType): Promise<{
        id: string;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        reason: import(".prisma/client").$Enums.DisputeReason;
        amount_claimed: number;
        resolution: import(".prisma/client").$Enums.DisputeResolution | null;
        resolution_notes: string | null;
        resolved_at: Date | null;
        admin_notes: string | null;
        evidence_deadline: Date | null;
        resolution_deadline: Date | null;
        transaction_id: string;
        respondent_id: string;
        assigned_admin_id: string | null;
        initiator_id: string;
    }>;
    addMessage(id: string, dto: AddMessageDto, admin: AdminContextType): Promise<{
        id: string;
        created_at: Date;
        dispute_id: string;
        content: string;
        is_internal: boolean;
        sender_id: string;
    }>;
}
