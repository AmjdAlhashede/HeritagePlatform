import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async findByContent(contentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { contentId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: { contentId: string; userName: string; text: string }) {
    const comment = this.commentRepository.create(data);
    return this.commentRepository.save(comment);
  }

  async remove(id: string) {
    await this.commentRepository.delete(id);
    return { message: 'تم حذف التعليق' };
  }

  async likeComment(id: string) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new Error('التعليق غير موجود');
    }

    comment.likes += 1;
    return this.commentRepository.save(comment);
  }
}
