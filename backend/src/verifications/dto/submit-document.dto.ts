import { IsString, IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class SubmitDocumentDto {
    @IsUUID()
    type_id: string;

    @IsString()
    file_url: string;

    @IsString()
    file_name: string;

    @IsNumber()
    file_size: number;

    @IsString()
    file_type: string;

    @IsOptional()
    @IsDateString()
    issue_date?: string;

    @IsOptional()
    @IsDateString()
    expiry_date?: string;
}
