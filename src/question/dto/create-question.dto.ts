import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(3)
  texto!: string;

  @IsOptional()
  @IsString()
  descricaoBusca?: string;

  @IsIn(['pulso', 'clima'])
  modalidade!: 'pulso' | 'clima';

  @IsIn(['qualitativa', 'quantitativa'])
  tipoResposta!: 'qualitativa' | 'quantitativa';
}
