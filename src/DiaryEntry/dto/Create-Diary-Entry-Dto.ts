import { IsNotEmpty, IsString, IsArray, IsInt } from 'class-validator';

export class CreateDiaryEntryDto {

  @IsNotEmpty()
  @IsString()
  emotion: string;

  @IsNotEmpty()
  date: Date;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  reasonIds: number[];
  
}