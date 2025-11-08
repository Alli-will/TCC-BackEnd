import {
  IsString,
  IsIn,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  ArrayNotEmpty,
  IsNumber,
} from 'class-validator';
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

  //nulo = todos os setores; valor = somente setor específico
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  //permitir múltiplos setores
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  departmentIds?: number[];
}
