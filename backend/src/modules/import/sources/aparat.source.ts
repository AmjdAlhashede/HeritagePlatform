import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  publishedAt: string;
}

@Injectable()
export class AparatSource {
  private readonly logger = new Logger(AparatSource.name);

  /**
   * جلب IDs فيديوهات Aparat من playlist
   * استخدام طريقة مباشرة لجلب البيانات
   */
  async fetchVideoIds(url: string, maxVideos: number): Promise<string[]> {
    try {
      const playlistId = this.extractPlaylistId(url);
      this.logger.log(`🔍 Aparat: جلب playlist ${playlistId}`);
      
      // استخدام yt-dlp مع flat-playlist لجلب IDs فقط
      // yt-dlp يدعم Aparat videos لكن ليس playlists
      // لذلك نستخدم طريقة بديلة: جلب الصفحة وتحليلها
      
      const videoIds = await this.scrapePlaylistPage(playlistId);
      
      if (videoIds.length === 0) {
        throw new Error('لم يتم العثور على فيديوهات في القائمة');
      }
      
      this.logger.log(`✅ Aparat: تم جلب ${videoIds.length} فيديو`);
      return videoIds.slice(0, maxVideos);
      
    } catch (error) {
      this.logger.error(`❌ Aparat: فشل جلب playlist - ${error.message}`);
      throw error;
    }
  }

  /**
   * استخراج playlist ID من الرابط
   */
  private extractPlaylistId(url: string): string {
    const match = url.match(/playlist\/(\d+)/);
    if (!match) {
      throw new Error('رابط playlist غير صحيح');
    }
    return match[1];
  }

  /**
   * جلب IDs من صفحة playlist باستخدام scraping
   */
  private async scrapePlaylistPage(playlistId: string): Promise<string[]> {
    try {
      const response = await fetch(`https://www.aparat.com/playlist/${playlistId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const html = await response.text();
      
      this.logger.log(`📄 حجم HTML: ${html.length} حرف`);
      
      // البحث عن video IDs في HTML
      const videoIds = new Set<string>();
      
      // نمط 1: روابط مباشرة /v/xxxxx
      const linkMatches = html.matchAll(/\/v\/([a-zA-Z0-9]+)/g);
      for (const match of linkMatches) {
        videoIds.add(match[1]);
      }
      
      // نمط 2: data attributes أو JSON
      const dataMatches = html.matchAll(/"uid"\s*:\s*"([a-zA-Z0-9]+)"/g);
      for (const match of dataMatches) {
        videoIds.add(match[1]);
      }
      
      // نمط 3: video hash في أي مكان
      const hashMatches = html.matchAll(/([a-zA-Z0-9]{10,})/g);
      for (const match of hashMatches) {
        const hash = match[1];
        // Aparat video IDs عادة 10-15 حرف
        if (hash.length >= 10 && hash.length <= 15 && /^[a-zA-Z0-9]+$/.test(hash)) {
          // تحقق إضافي: يجب أن يكون في سياق video
          if (html.includes(`"${hash}"`) || html.includes(`/${hash}`)) {
            videoIds.add(hash);
          }
        }
      }
      
      this.logger.log(`🔍 وجدت ${videoIds.size} IDs محتملة`);
      
      // حفظ HTML للتحليل إذا لم نجد شيء
      if (videoIds.size === 0) {
        const fs = require('fs');
        fs.writeFileSync('aparat-playlist-debug.html', html);
        this.logger.error(`💾 تم حفظ HTML في aparat-playlist-debug.html للتحليل`);
      }
      
      return Array.from(videoIds);
      
    } catch (error) {
      throw new Error(`فشل scraping الصفحة: ${error.message}`);
    }
  }

  /**
   * جلب معلومات فيديو واحد
   */
  async fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      const videoUrl = `https://www.aparat.com/v/${videoId}`;
      const command = `yt-dlp --dump-json "${videoUrl}"`;

      const { stdout } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      });

      const data = JSON.parse(stdout);

      return {
        id: videoId,
        title: data.title || 'بدون عنوان',
        description: data.description || '',
        thumbnailUrl: this.getBestThumbnail(data),
        videoUrl: videoUrl,
        duration: data.duration || 0,
        publishedAt: data.upload_date ? this.parseAparatDate(data.upload_date) : new Date().toISOString(),
      };
      
    } catch (error) {
      this.logger.error(`❌ Aparat: فشل جلب معلومات ${videoId} - ${error.message}`);
      throw error;
    }
  }

  private getBestThumbnail(data: any): string {
    if (data.thumbnails && data.thumbnails.length > 0) {
      return data.thumbnails[data.thumbnails.length - 1].url;
    }
    return data.thumbnail || '';
  }

  private parseAparatDate(dateStr: string): string {
    try {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }
}
