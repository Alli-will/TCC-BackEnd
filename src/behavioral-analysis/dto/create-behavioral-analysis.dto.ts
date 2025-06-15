import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateBehavioralAnalysisDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsInt()
  created_by_user_id: number;
}
