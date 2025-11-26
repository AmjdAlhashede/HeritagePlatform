import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, OneToMany, JoinColumn, JoinTable } from 'typeorm';
import { Performer } from '../performers/performers.entity';
import { Category } from '../categories/category.entity';
import { Comment } from '../comments/comment.entity';

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

  @Column({ nullable: true })
  originalFileUrl: string;

  @Column({ nullable: true })
  hlsUrl: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  // Wasabi Cloud URLs (after publishing)
  @Column({ nullable: true })
  cloudVideoUrl: string;

  @Column({ nullable: true })
  cloudAudioUrl: string;

  @Column({ nullable: true })
  cloudThumbnailUrl: string;

  @Column({ nullable: true })
  cloudHlsUrl: string;

  @Column({ default: false })
  isUploadedToCloud: boolean;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Performer, performer => performer.content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performer_id' })
  performer: Performer;

  @Column({ name: 'performer_id', nullable: true })
  performerId: string;

  @ManyToMany(() => Category, category => category.content)
  @JoinTable({
    name: 'content_categories',
    joinColumn: { name: 'content_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Comment, comment => comment.content)
  comments: Comment[];

  @Column({ type: 'date', nullable: true })
  originalDate: Date;

  // External source fields (for imported content)
  @Column({ nullable: true })
  externalSource: string; // 'aparat', 'youtube', etc.

  @Column({ nullable: true })
  externalId: string; // video ID from external platform

  @Column({ nullable: true })
  externalUrl: string; // original URL

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
