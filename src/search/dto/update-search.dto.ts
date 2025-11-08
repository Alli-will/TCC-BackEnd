import {
  IsString,
  IsIn,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDtoU {
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

export class UpdateSearchDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pulso', 'clima'])
  tipo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDtoU)
  perguntas?: QuestionDtoU[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  departmentIds?: number[];
}
