import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Performer } from '../performers/performers.entity';

export enum ContentType {
  VIDEO = 'video',
  AUDIO = 'audio',
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @Column()
  originalFileUrl: string;

  @Column({ nullable: true })
  hlsUrl: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Performer, performer => performer.content)
  @JoinColumn({ name: 'performer_id' })
  performer: Performer;

  @Column({ name: 'performer_id' })
  performerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
