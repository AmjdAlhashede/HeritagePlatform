import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Content } from '../content/content.entity';

@Entity('performers')
export class Performer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // الاسم الجهادي (مثل: أبو علي الحاكم)

  @Column({ nullable: true })
  shortName: string; // الاسم المختصر (مثل: علي الحاكم)

  @Column({ nullable: true })
  fullName: string; // الاسم الكامل الحقيقي (مثل: علي محمد أحمد الحاكم)

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: Record<string, string>;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'date', nullable: true })
  deathDate: Date;

  @Column({ type: 'date', nullable: true })
  joinedAnsarallahDate: Date;

  @Column({ default: false })
  isDeceased: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Content, content => content.performer, { cascade: true, onDelete: 'CASCADE' })
  content: Content[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
