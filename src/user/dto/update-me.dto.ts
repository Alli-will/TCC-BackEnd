import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMeDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  first_Name: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Sobrenome é obrigatório.' })
  last_Name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'Email inválido.' })
  @IsNotEmpty({ message: 'Email é obrigatório.' })
  email: string;

  // Senha opcional; quando enviada, deve ser string (regras de força podem ser aplicadas aqui se necessário)
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string.' })
  password?: string;
}
