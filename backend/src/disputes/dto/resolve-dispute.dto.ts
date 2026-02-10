import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { DisputeResolution } from '@prisma/client';

export class ResolveDisputeDto {
    @IsEnum(DisputeResolution)
    @IsNotEmpty()
    resolution: DisputeResolution;

    @IsString()
    @IsNotEmpty()
    notes: string;
}
