import { IsString, IsIn, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDto {
  @IsString()
  texto: string;
  @IsArray()
  opcoes: any[];
  @IsOptional()
  obrigatoria?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  questionId?: number;
}

export class CreateSearchDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsIn(['pulso', 'clima'])
  tipo: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  perguntas?: QuestionDto[];
}
