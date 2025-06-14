import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikeFeedDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;

}