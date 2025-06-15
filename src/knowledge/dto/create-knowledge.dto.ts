import { IsOptional, IsString, IsDate, IsInt, ValidateIf } from 'class-validator';

export class CreateKnowledgeDto {
  @ValidateIf(o => !o.url)
  attachment?: Buffer;
  
  @ValidateIf(o => !o.attachment)
  @IsString()
  url?: string;

  @IsOptional()
  @IsDate()
  created_at?: Date;

  @IsOptional()
  @IsDate()
  updated_at?: Date;

  @IsOptional()
  @IsDate()
  deleted_at?: Date;

  @IsOptional()
  @IsInt()
  createdBy_user?: number;
}
