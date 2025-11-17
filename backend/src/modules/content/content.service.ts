import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './content.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async findAll(page = 1, limit = 20, performerId?: string) {
    const where: any = { isActive: true, isProcessed: true };
    if (performerId) {
      where.performerId = performerId;
    }

    const [content, total] = await this.contentRepository.findAndCount({
      where,
      relations: ['performer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Filter out content with missing files
    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return item.hlsUrl && item.thumbnailUrl;
      } else {
        return item.audioUrl;
      }
    });

    return {
      data: validContent,
      meta: {
        total: validContent.length,
        page,
        limit,
        totalPages: Math.ceil(validContent.length / limit),
      },
    };
  }

  async getTrending(limit = 10) {
    const content = await this.contentRepository.find({
      where: { isActive: true, isProcessed: true },
      relations: ['performer'],
      take: limit * 2, // Get more to filter
      order: { viewCount: 'DESC', createdAt: 'DESC' },
    });

    // Filter out content with missing files
    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return item.hlsUrl && item.thumbnailUrl;
      } else {
        return item.audioUrl;
      }
    }).slice(0, limit);

    return {
      data: validContent,
      meta: {
        total: validContent.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };
  }

  async getRecommended(limit = 10) {
    // Get content with good view/download ratio
    const content = await this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.performer', 'performer')
      .where('content.isActive = :isActive', { isActive: true })
      .andWhere('content.isProcessed = :isProcessed', { isProcessed: true })
      .andWhere('content.viewCount > :minViews', { minViews: 10 })
      .orderBy('content.viewCount', 'DESC')
      .addOrderBy('content.downloadCount', 'DESC')
      .take(limit * 2)
      .getMany();

    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return item.hlsUrl && item.thumbnailUrl;
      } else {
        return item.audioUrl;
      }
    }).slice(0, limit);

    return {
      data: validContent,
      meta: {
        total: validContent.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };
  }

  async getRecent(limit = 10) {
    const content = await this.contentRepository.find({
      where: { isActive: true, isProcessed: true },
      relations: ['performer'],
      take: limit * 2,
      order: { createdAt: 'DESC' },
    });

    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return item.hlsUrl && item.thumbnailUrl;
      } else {
        return item.audioUrl;
      }
    }).slice(0, limit);

    return {
      data: validContent,
      meta: {
        total: validContent.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };
  }

  async findOne(id: string) {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['performer'],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async incrementViewCount(id: string) {
    await this.contentRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementDownloadCount(id: string) {
    await this.contentRepository.increment({ id }, 'downloadCount', 1);
  }

  async create(contentData: any) {
    const content = this.contentRepository.create(contentData);
    return this.contentRepository.save(content);
  }

  async update(id: string, contentData: any) {
    await this.contentRepository.update(id, contentData);
    return this.findOne(id);
  }

  async remove(id: string) {
    const content = await this.findOne(id);
    await this.contentRepository.remove(content);
    return { message: 'Content deleted successfully' };
  }
}
