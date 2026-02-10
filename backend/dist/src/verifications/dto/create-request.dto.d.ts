import { VerificationScope } from '@prisma/client';
export declare class CreateVerificationRequestDto {
    scope: VerificationScope;
    listing_id?: string;
    transaction_id?: string;
}
