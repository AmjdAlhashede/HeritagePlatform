import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../content/content.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async getTrending(limit = 10) {
    return this.contentRepository.find({
      where: { isActive: true },
      order: { viewCount: 'DESC' },
      take: limit,
      relations: ['performer'],
    });
  }

  async getPopular(limit = 10) {
    return this.contentRepository.find({
      where: { isActive: true },
      order: { downloadCount: 'DESC' },
      take: limit,
      relations: ['performer'],
    });
  }
}
