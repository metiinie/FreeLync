import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { VerificationRequestStatus } from '@prisma/client';

export class ReviewRequestDto {
    @IsEnum(VerificationRequestStatus)
    status: VerificationRequestStatus;

    @IsOptional()
    @IsString()
    rejection_reason?: string;

    @IsOptional()
    @IsString()
    admin_notes?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    confidence_score?: number;
}
