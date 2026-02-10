import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddEvidenceDto {
    @IsString()
    @IsNotEmpty()
    file_url: string;

    @IsString()
    @IsNotEmpty()
    file_type: string; // IMAGE, DOCUMENT, VIDEO

    @IsString()
    @IsOptional()
    description?: string;
}
