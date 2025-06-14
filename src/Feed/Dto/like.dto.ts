import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikeFeedDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;
<<<<<<< HEAD
=======

>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
}