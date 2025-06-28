import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, IsOptional, IsNumber } from "class-validator";
import { IsUniqueEmail } from "../../auth/unique-email.validator";


export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  first_Name: string;   
    
  @IsNotEmpty()
  @IsString()   
  last_Name: string;

  @IsNotEmpty()
  @IsEmail()
  @IsUniqueEmail({ message: 'Este email já está cadastrado' }) 
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8, 
    minUppercase: 0, 
    minLowercase: 1, 
    minNumbers: 1,
    minSymbols: 0, 
  },{message: 'A senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 letra minúscula e 1 número.'})
  password: string;

  @IsOptional()
  @IsNumber()
  companyId?: number; 

  @IsOptional()
  @IsNumber()
  departmentId?: number;
}



