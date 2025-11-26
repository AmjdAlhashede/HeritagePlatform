import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Performer } from '../performers/performers.entity';
import { Content } from '../content/content.entity';
import { MetadataService } from '../upload/metadata.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Performer)
    private performerRepository: Repository<Performer>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private metadataService: MetadataService,
  ) {}

  /**
   * استرجاع كل البيانات من R2
   */
  async syncFromR2() {
    this.logger.log('🔄 بدء استرجاع البيانات من R2...');

    try {
      const result = await this.metadataService.syncFromR2();

      this.logger.log(`✅ تم استرجاع ${result.performers} مؤدي و ${result.content} محتوى`);

      return {
        performers: result.performers,
        content: result.content,
      };
    } catch (error) {
      this.logger.error(`❌ فشل الاسترجاع: ${error.message}`);
      throw error;
    }
  }

  /**
   * الحصول على حالة المزامنة
   */
  async getSyncStatus() {
    const performersCount = await this.performerRepository.count();
    const contentCount = await this.contentRepository.count();

    return {
      neon: {
        performers: performersCount,
        content: contentCount,
      },
      r2: {
        enabled: true, // TODO: التحقق من R2
        performers: 0, // TODO: عد المؤدين في R2
        content: 0, // TODO: عد المحتوى في R2
      },
      synced: true, // TODO: مقارنة الأعداد
    };
  }

  /**
   * إعادة بناء metadata لكل المحتوى
   */
  async rebuildMetadata() {
    this.logger.log('🔄 بدء إعادة بناء metadata...');

    try {
      // جلب كل المؤدين
      const performers = await this.performerRepository.find();
      
      for (const performer of performers) {
        const hash = this.metadataService.generatePerformerHash(performer.name);
        
        await this.metadataService.savePerformerMetadata({
          id: performer.id,
          hash,
          name: performer.name,
          bio: performer.bio,
          location: performer.location,
          birthDate: (performer as any).birthDate,
          deathDate: (performer as any).deathDate,
          joinedAnsarallahDate: (performer as any).joinedAnsarallahDate,
          isDeceased: (performer as any).isDeceased || false,
          imageUrl: performer.imageUrl,
          createdAt: performer.createdAt.toISOString(),
          updatedAt: performer.updatedAt.toISOString(),
        });
      }

      // جلب كل المحتوى
      const content = await this.contentRepository.find({
        relations: ['performer'],
      });

      for (const item of content) {
        const performerHash = this.metadataService.generatePerformerHash(
          item.performer.name,
        );
        const contentHash = this.metadataService.generateContentHash(
          item.title,
          performerHash,
        );

        await this.metadataService.saveContentMetadata({
          id: item.id,
          hash: contentHash,
          title: item.title,
          description: item.description,
          performerHash,
          performerName: item.performer.name,
          type: item.type as 'video' | 'audio',
          duration: item.duration,
          fileSize: item.fileSize,
          originalDate: item.originalDate?.toISOString(),
          categories: [], // TODO: جلب التصنيفات
          thumbnailUrl: item.thumbnailUrl,
          hlsUrl: item.hlsUrl,
          audioUrl: item.audioUrl,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        });
      }

      this.logger.log(`✅ تم إعادة بناء metadata لـ ${performers.length} مؤدي و ${content.length} محتوى`);

      return {
        performers: performers.length,
        content: content.length,
      };
    } catch (error) {
      this.logger.error(`❌ فشل إعادة البناء: ${error.message}`);
      throw error;
    }
  }
}
