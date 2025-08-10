import { IsArray, IsInt, IsNotEmpty, IsObject } from 'class-validator';

export class RespondSearchDto {
  @IsInt()
  searchId: number;

  @IsArray()
  @IsNotEmpty()
  answers: any[]; // cada resposta pode ter { pergunta: string, resposta: valor }
}
