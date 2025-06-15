import { IsOptional, IsString, IsDate, IsInt } from 'class-validator';

export class CreateKnowledgeDto {
  @IsOptional()
  anexo?: Buffer;

  @IsOptional()
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
