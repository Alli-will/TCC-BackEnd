import { IsNotEmpty } from 'class-validator';

export class CreateFeedDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;
}