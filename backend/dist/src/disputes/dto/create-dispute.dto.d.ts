import { DisputeReason } from '@prisma/client';
export declare class CreateDisputeDto {
    transaction_id: string;
    reason: DisputeReason;
    description: string;
    amount_claimed: number;
}
