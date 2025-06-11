import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CommentFeedDto {
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  text: string;
}