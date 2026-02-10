import { VerificationRequestStatus } from '@prisma/client';
export declare class ReviewRequestDto {
    status: VerificationRequestStatus;
    rejection_reason?: string;
    admin_notes?: string;
    confidence_score?: number;
}
