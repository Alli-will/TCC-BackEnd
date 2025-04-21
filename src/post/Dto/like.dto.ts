import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikePostDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;
}