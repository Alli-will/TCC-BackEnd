import { IsString, IsNotEmpty, IsPhoneNumber, IsNumber } from 'class-validator';

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

  @IsNumber({},{ message: 'Obrigatorio informar o CEP' }) 
  @IsNotEmpty ({ message: 'O CEP deve ser um número válido' })
  addressZipCode: number;

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

  @IsNumber({},{ message: 'Obrigatorio informar o Telefone' })
  @IsNotEmpty({ message: 'Telefone deve ser um número válido' })
  phone: number;





}
