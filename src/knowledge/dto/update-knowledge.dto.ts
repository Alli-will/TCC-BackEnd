import { IsOptional, IsString } from 'class-validator';

export class UpdateKnowledgeDto {
  @IsOptional()
  anexo?: Buffer;

  @IsOptional()
  @IsString()
  url?: string;
}
