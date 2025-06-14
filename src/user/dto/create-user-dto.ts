<<<<<<< HEAD
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, IsOptional, IsIn, isNotEmpty, IsNumber,  } from "class-validator";
import { UserRole } from "../entity/user.entity";
=======
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, IsOptional, IsNumber } from "class-validator";
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
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
<<<<<<< HEAD
  companyId?: number; 

  departmentId?: number;

  /*@IsOptional()
  @IsIn(['client', 'psychologist', 'psychiatrist']) 
  role?: UserRole;
  CLIENT: string;*/

=======
  @IsNumber()
  companyId?: number; 

  @IsOptional()
  @IsNumber()
  departmentId?: number;
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
}



