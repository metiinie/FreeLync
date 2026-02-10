import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AddMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsBoolean()
    @IsOptional()
    is_internal?: boolean;
}
