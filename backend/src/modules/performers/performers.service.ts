import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Performer } from './performers.entity';
import { CreatePerformerDto, UpdatePerformerDto } from './dto';
import { Content } from '../content/content.entity';
import { CloudStorageService } from '../upload/cloud-storage.service';

@Injectable()
export class PerformersService {
  private readonly logger = new Logger(PerformersService.name);

  constructor(
    @InjectRepository(Performer)
    private performersRepository: Repository<Performer>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private cloudStorageService: CloudStorageService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  async findAll(page = 1, limit = 20) {
    const cacheKey = `performers_all_${page}_${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const [performers, total] = await this.performersRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const result = {
      data: performers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 600000); // 10 minutes
    return result;
  }

  async findOne(id: string): Promise<any> {
    const cacheKey = `performer_${id}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;
    const performer = await this.performersRepository.findOne({
      where: { id },
      relations: ['content'],
    });

    if (!performer) {
      throw new NotFoundException(`Performer with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, performer, 600000); // 10 minutes
    return performer;
  }

  async create(createPerformerDto: CreatePerformerDto) {
    const performer = this.performersRepository.create(createPerformerDto);
    return this.performersRepository.save(performer);
  }

  async update(id: string, updatePerformerDto: UpdatePerformerDto) {
    const performer = await this.findOne(id);
    Object.assign(performer, updatePerformerDto);
    return this.performersRepository.save(performer);
  }

  async remove(id: string) {
    const performer = await this.findOne(id);
    if (!performer) {
      throw new NotFoundException('Performer not found');
    }

    this.logger.log(`🗑️  بدء حذف المؤدي: ${performer.name}`);

    // جلب كل المحتوى الخاص بالمؤدي
    const content = await this.contentRepository.find({
      where: { performerId: id },
    });

    this.logger.log(`📦 عدد المحتويات المرتبطة: ${content.length}`);

    // حذف ملفات كل محتوى من R2
    if (this.cloudStorageService.isEnabled()) {
      for (const item of content) {
        try {
          this.logger.log(`🗑️  حذف ملفات المحتوى: ${item.title}`);

          // حذف مجلد المحتوى بالكامل من R2
          const folderPath = `content/${item.id}/`;

          // حذف الملفات الرئيسية
          const filesToDelete = [
            `${folderPath}original.mp4`,
            `${folderPath}audio.mp3`,
            `${folderPath}thumbnail.jpg`,
            `${folderPath}metadata.json`,
          ];

          for (const file of filesToDelete) {
            try {
              await this.cloudStorageService.deleteFile(file);
            } catch (err) {
              // تجاهل الأخطاء إذا كان الملف غير موجود
            }
          }

          this.logger.log(`✅ تم حذف ملفات: ${item.title}`);
        } catch (error) {
          this.logger.error(`❌ فشل حذف ملفات المحتوى ${item.id}: ${error.message}`);
        }
      }
    }

    // حذف المحتوى من قاعدة البيانات
    await this.contentRepository.delete({ performerId: id });
    this.logger.log(`✅ تم حذف ${content.length} محتوى من قاعدة البيانات`);

    // حذف المؤدي
    await this.performersRepository.delete(id);
    this.logger.log(`✅ تم حذف المؤدي: ${performer.name}`);

    return {
      success: true,
      message: `تم حذف المؤدي و ${content.length} محتوى مرتبط به`,
      deletedContent: content.length,
    };
  }

  async getPerformerContent(performerId: string, page = 1, limit = 20) {
    // التحقق من وجود المؤدي
    await this.findOne(performerId);

    const [content, total] = await this.performersRepository
      .createQueryBuilder('performer')
      .leftJoinAndSelect('performer.content', 'content')
      .where('performer.id = :performerId', { performerId })
      .andWhere('content.isActive = :isActive', { isActive: true })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('content.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: content[0]?.content || [],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
