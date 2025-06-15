import { IsOptional, IsString, ValidateIf, IsNotEmpty } from 'class-validator';

export class CreateSupportMaterialDto {
  @ValidateIf(o => !o.url)
  @IsOptional()
  @IsNotEmpty({ message: 'attachment ou url deve ser informado.' })
  attachment?: Buffer;

  @ValidateIf(o => !o.attachment)
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'attachment ou url deve ser informado.' })
  url?: string;

  @IsOptional()
  @IsString()
  emotion?: string;

  @IsOptional()
  reason_emotion_id?: number;
}
