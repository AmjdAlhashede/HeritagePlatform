import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './likes.entity';
import { Content } from '../content/content.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async toggleLike(userId: string, contentId: string): Promise<{ liked: boolean; totalLikes: number }> {
    // Check if content exists
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if like exists
    const existingLike = await this.likesRepository.findOne({
      where: { userId, contentId },
    });

    if (existingLike) {
      // Unlike
      await this.likesRepository.remove(existingLike);
      const totalLikes = await this.likesRepository.count({ where: { contentId } });
      return { liked: false, totalLikes };
    } else {
      // Like
      const like = this.likesRepository.create({ userId, contentId });
      await this.likesRepository.save(like);
      const totalLikes = await this.likesRepository.count({ where: { contentId } });
      return { liked: true, totalLikes };
    }
  }

  async isLiked(userId: string, contentId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { userId, contentId },
    });
    return !!like;
  }

  async getLikesCount(contentId: string): Promise<number> {
    return this.likesRepository.count({ where: { contentId } });
  }

  async getUserLikes(userId: string): Promise<string[]> {
    const likes = await this.likesRepository.find({
      where: { userId },
      select: ['contentId'],
    });
    return likes.map(like => like.contentId);
  }
}
