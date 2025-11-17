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
    const where: any = { isActive: true };
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

    return {
      data: content,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
