import { IsNotEmpty, IsString} from 'class-validator';

export class CreateDiaryEntryDto {
  @IsNotEmpty()
  @IsString()
  emotion: string;

  @IsNotEmpty()
  date: Date;

  @IsNotEmpty()
  @IsString()
  description: string;
  
}