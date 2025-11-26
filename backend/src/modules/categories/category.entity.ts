import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Content } from '../content/content.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string; // emoji أو icon name

  @Column({ default: 0 })
  order: number; // ترتيب العرض

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Content, content => content.categories)
  content: Content[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
