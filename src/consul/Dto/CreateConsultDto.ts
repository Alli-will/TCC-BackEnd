import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateConsultDto {
  @IsDateString()
  date: string; 

  @IsEnum(['psychologist', 'psychiatrist'])
  type: 'psychologist' | 'psychiatrist';

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  clientId: number;

  @IsNumber()
  @IsNotEmpty()
  professionalId: number;
}