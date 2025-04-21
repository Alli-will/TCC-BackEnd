import { IsNotEmpty, IsString, IsOptional, IsEnum, IsIn } from 'class-validator';

export class CreateDiaryEntryDto {
  static readonly DiscouragementReason = {
    WORK: 'Trabalho',
    FAMILY: 'Família',
    HEALTH: 'Saúde',
    RELATIONSHIPS: 'Relacionamentos',
    FINANCE: 'Finanças',
    STUDIES: 'Estudos',
    LONELINESS: 'Solidão',
    OTHER: 'Outro'
  } as const;

  @IsNotEmpty()
  @IsString()
  emotion: string;

  @IsNotEmpty()
  date: Date;

  @IsNotEmpty()
  @IsString()
  description: string;
  
  @IsOptional()
  @IsString()
  @IsIn(Object.values(CreateDiaryEntryDto.DiscouragementReason))
  reason_discouragement?: string;
}