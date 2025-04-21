import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, IsOptional, IsIn,  } from "class-validator";
import { UserRole } from "../entity/user.entity";
import { IsUniqueEmail } from "src/auth/unique-email.validator";


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
  @IsIn(['client', 'psychologist', 'psychiatrist']) 
  role?: UserRole;
  CLIENT: string;

}



