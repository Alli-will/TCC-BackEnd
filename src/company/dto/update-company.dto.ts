import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cnpj?: string; // somente dígitos

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Matches(/^\d{8}$/,{ message: 'CEP deve conter 8 dígitos' })
  addressZipCode?: string; // enviar como string de 8 dígitos

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Matches(/^\d{10,11}$/,{ message: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)' })
  phone?: string; // somente dígitos
}
