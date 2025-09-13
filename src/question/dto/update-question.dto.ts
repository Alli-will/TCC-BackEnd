import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  texto?: string;

  @IsOptional()
  @IsString()
  descricaoBusca?: string;

  @IsOptional()
  @IsIn(['pulso', 'clima'])
  modalidade?: 'pulso' | 'clima';

  @IsOptional()
  @IsIn(['qualitativa', 'quantitativa'])
  tipoResposta?: 'qualitativa' | 'quantitativa';

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
