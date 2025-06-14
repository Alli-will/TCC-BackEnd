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
    minUppercase: 1, 
    minLowercase: 1, 
    minNumbers: 1,
  })
  password: string;

  @IsOptional()
  @IsNumber()
  companyId?: number; 

  @IsOptional()
  @IsNumber()
  departmentId?: number;
}



