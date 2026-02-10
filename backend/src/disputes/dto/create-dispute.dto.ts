import { IsEnum, IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { DisputeReason } from '@prisma/client';

export class CreateDisputeDto {
    @IsString()
    @IsNotEmpty()
    transaction_id: string;

    @IsEnum(DisputeReason)
    @IsNotEmpty()
    reason: DisputeReason;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    amount_claimed: number;
}
