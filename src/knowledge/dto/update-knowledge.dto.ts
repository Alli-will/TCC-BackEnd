import { IsOptional, IsString } from 'class-validator';

export class UpdateKnowledgeDto {
  @IsOptional()
  attachment?: Buffer;

  @IsOptional()
  @IsString()
  url?: string;
}
