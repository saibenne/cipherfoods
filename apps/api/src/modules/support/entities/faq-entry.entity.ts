import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('faq_entries', { schema: 'support' })
export class FaqEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ length: 100 })
  category: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
