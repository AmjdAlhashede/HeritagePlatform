import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Content } from './content.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  async findAll(page = 1, limit = 20, performerId?: string) {
    const cacheKey = `content_all_${page}_${limit}_${performerId || 'all'}`;

    // Check cache first
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

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

    // Filter out content with missing files and use cloud URLs if available
    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return (item.cloudHlsUrl || item.hlsUrl) && (item.cloudThumbnailUrl || item.thumbnailUrl);
      } else {
        return (item.cloudAudioUrl || item.audioUrl);
      }
    }).map(item => this.mapContentUrls(item));

    const result = {
      data: validContent,
      meta: {
        total: validContent.length,
        page,
        limit,
        totalPages: Math.ceil(validContent.length / limit),
      },
    };

    // Store in cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async getTrending(limit = 10) {
    const cacheKey = `content_trending_${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const content = await this.contentRepository.find({
      where: { isActive: true },
      relations: ['performer'],
      take: limit * 2,
      order: { viewCount: 'DESC', createdAt: 'DESC' },
    });

    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return (item.cloudHlsUrl || item.hlsUrl) && (item.cloudThumbnailUrl || item.thumbnailUrl);
      } else {
        return (item.cloudAudioUrl || item.audioUrl);
      }
    }).map(item => this.mapContentUrls(item)).slice(0, limit);

    const result = {
      data: validContent,
      meta: {
        total: validContent.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };

    await this.cacheManager.set(cacheKey, result, 600000); // 10 minutes
    return result;
  }

  async getRecommended(limit = 10) {
    const cacheKey = `content_recommended_${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const content = await this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.performer', 'performer')
      .where('content.isActive = :isActive', { isActive: true })
      .andWhere('content.viewCount > :minViews', { minViews: 10 })
      .orderBy('content.viewCount', 'DESC')
      .addOrderBy('content.downloadCount', 'DESC')
      .take(limit * 2)
      .getMany();

    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return (item.cloudHlsUrl || item.hlsUrl) && (item.cloudThumbnailUrl || item.thumbnailUrl);
      } else {
        return (item.cloudAudioUrl || item.audioUrl);
      }
    }).map(item => this.mapContentUrls(item)).slice(0, limit);

    const result = {
      data: validContent,
      meta: {
        total: validContent.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };

    await this.cacheManager.set(cacheKey, result, 600000); // 10 minutes
    return result;
  }

  async getRecent(limit = 10) {
    const content = await this.contentRepository.find({
      where: { isActive: true },
      relations: ['performer'],
      take: limit * 2,
      order: { createdAt: 'DESC' },
    });

    const validContent = content.filter(item => {
      if (item.type === 'video') {
        return (item.cloudHlsUrl || item.hlsUrl) && (item.cloudThumbnailUrl || item.thumbnailUrl);
      } else {
        return (item.cloudAudioUrl || item.audioUrl);
      }
    }).map(item => this.mapContentUrls(item)).slice(0, limit);

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

  async findOne(id: string): Promise<Content> {
    const cacheKey = `content_${id}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData as Content;

    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['performer'],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    const result = this.mapContentUrls(content);
    await this.cacheManager.set(cacheKey, result, 600000); // 10 minutes
    return result as Content;
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
    if (content) {
      await this.contentRepository.remove(content);
    }
    return { message: 'Content deleted successfully' };
  }

  /**
   * تحويل الروابط لاستخدام السحابة إذا كانت متوفرة
   */
  private mapContentUrls(content: Content): Content {
    return {
      ...content,
      hlsUrl: content.cloudHlsUrl || content.hlsUrl,
      audioUrl: content.cloudAudioUrl || content.audioUrl,
      thumbnailUrl: content.cloudThumbnailUrl || content.thumbnailUrl,
      originalFileUrl: content.cloudVideoUrl || content.originalFileUrl,
    };
  }
}
