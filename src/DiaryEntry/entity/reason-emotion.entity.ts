import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { DiaryEntry } from '../../DiaryEntry/entity/Diary-entry.entity';

@Entity()
export class ReasonEmotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  reason: string;

  @ManyToMany(() => DiaryEntry, (entry) => entry.reasons)
  diaryEntries: DiaryEntry[];
}
