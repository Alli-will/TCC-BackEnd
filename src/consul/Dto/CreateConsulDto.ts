import { IsDateString, IsIn } from 'class-validator';

export class CreateConsulDto {
  @IsDateString({}, { message: 'date must be a valid date string (ISO 8601)' })
  date: string;

  @IsIn(['psychologist', 'psychiatrist'], { message: 'type must be either psychologist or psychiatrist' })
  type: 'psychologist' | 'psychiatrist';
}