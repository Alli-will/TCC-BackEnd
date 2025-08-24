import { IsString, IsNotEmpty, IsNumber, Matches, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString({message: 'Obrigatorio informar o Nome'})
  @IsNotEmpty({ message: 'Nome deve ser válido' })
  name: string;

  @IsString({message: 'Obrigatorio informar o CNPJ'})
  @IsNotEmpty({ message: 'CNPJ deve ser um número válido' })
  cnpj: string;

  @IsString({message: 'Obrigatorio informar o Endereço'})
  @IsNotEmpty({ message: 'Endereço deve ser válido' })
  address: string;

  @IsString({ message: 'Obrigatorio informar o CEP' })
  @Matches(/^\d{8}$/,{ message: 'CEP deve conter 8 dígitos' })
  addressZipCode: string;

  @IsString({message: 'Obrigatorio informar o Bairro'})
  @IsNotEmpty({ message: 'Bairro deve ser válido' })
  neighborhood: string;

  @IsString({message: 'Obrigatorio informar o Municipio'})
  @IsNotEmpty({ message: 'Municipio deve ser válido' })
  municipality: string;

  @IsString({message: 'Obrigatorio informar o Estado'})
  @IsNotEmpty({ message: 'Estado deve ser válido' })
  state: string;


  @IsString({message: 'Obrigatorio informar o Pais'})
  @IsNotEmpty({ message: 'País deve ser válido' })
  country: string;

  @IsString({ message: 'Obrigatorio informar o Telefone' })
  @Matches(/^\d{10,11}$/,{ message: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)' })
  phone: string;





}
