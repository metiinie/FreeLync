import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { VerificationScope } from '@prisma/client';

export class CreateVerificationRequestDto {
    @IsEnum(VerificationScope)
    scope: VerificationScope;

    @IsOptional()
    @IsUUID()
    listing_id?: string;

    @IsOptional()
    @IsUUID()
    transaction_id?: string;
}
