import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

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
export class TwitterSource {
  private readonly logger = new Logger(TwitterSource.name);

  /**
   * جلب IDs فيديوهات Twitter فقط
   */
  async fetchVideoIds(url: string, maxVideos: number): Promise<string[]> {
    try {
      let targetUrl = url;
      if (!url.includes('http') && !url.includes('/')) {
        targetUrl = `https://twitter.com/${url.replace('@', '')}`;
      }

      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      let command = `gallery-dl --print "{tweet_id}"`;
      
      if (fs.existsSync(cookiesPath)) {
        command += ` --cookies "${cookiesPath}"`;
      }
      
      command += ` "${targetUrl}"`;

      const { stdout } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 120000,
      });

      const tweetIds = stdout
        .split('\n')
        .map(id => id.trim())
        .filter(id => id && /^\d+$/.test(id))
        .slice(0, maxVideos);

      this.logger.log(`✅ Twitter: تم جلب ${tweetIds.length} فيديو`);
      return tweetIds;
      
    } catch (error) {
      this.logger.error(`❌ Twitter: فشل جلب IDs - ${error.message}`);
      throw new Error(`فشل جلب قائمة Twitter: ${error.message}`);
    }
  }

  /**
   * جلب معلومات فيديو واحد
   */
  async fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      const videoUrl = `https://twitter.com/i/status/${videoId}`;
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      
      let command = `yt-dlp --dump-json`;
      
      if (fs.existsSync(cookiesPath)) {
        command += ` --cookies "${cookiesPath}"`;
      }
      
      command += ` "${videoUrl}"`;

      const { stdout } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      });

      const data = JSON.parse(stdout);

      // فلترة حسب المدة: يجب أن تكون بين 60 ثانية و 600 ثانية (1-10 دقائق)
      const duration = data.duration || 0;
      if (duration < 60) {
        throw new Error(`الفيديو قصير جداً (${duration} ثانية) - الحد الأدنى دقيقة واحدة`);
      }
      if (duration > 600) {
        throw new Error(`الفيديو طويل جداً (${Math.floor(duration / 60)} دقيقة) - الحد الأقصى 10 دقائق`);
      }

      // استخراج تاريخ النشر من Twitter
      let publishedAt = new Date().toISOString();
      if (data.timestamp) {
        publishedAt = new Date(data.timestamp * 1000).toISOString();
      } else if (data.upload_date) {
        // صيغة: 20241101
        const year = data.upload_date.substring(0, 4);
        const month = data.upload_date.substring(4, 6);
        const day = data.upload_date.substring(6, 8);
        publishedAt = new Date(`${year}-${month}-${day}`).toISOString();
      }

      return {
        id: videoId,
        title: this.extractTitle(data),
        description: this.extractDescription(data),
        thumbnailUrl: this.getBestThumbnail(data),
        videoUrl: videoUrl,
        duration: duration,
        publishedAt: publishedAt,
      };
      
    } catch (error) {
      this.logger.error(`❌ Twitter: فشل جلب معلومات ${videoId} - ${error.message}`);
      throw error;
    }
  }

  private extractTitle(data: any): string {
    let fullText = '';
    
    if (data.description) {
      fullText = data.description.split('\n')[0].trim();
    } else if (data.title) {
      fullText = data.title;
    }
    
    fullText = fullText.replace(/https?:\/\/\S+$/g, '').trim();
    
    // استخراج العنوان بذكاء
    const patterns = [
      /\|\s*([^-]+?)\s*-/,
      /(?:زامل|قصيدة|أنشودة)\s*\|\s*([^-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1] && match[1].length > 3 && match[1].length < 100) {
        return match[1].trim();
      }
    }
    
    return fullText.substring(0, 50).trim();
  }

  private extractDescription(data: any): string {
    if (!data.description) return '';
    
    // إرجاع الوصف الكامل بدون حذف أي شي
    return data.description.trim();
  }

  private getBestThumbnail(data: any): string {
    if (data.thumbnails && data.thumbnails.length > 0) {
      const origThumb = data.thumbnails.find((t: any) => t.id === 'orig');
      if (origThumb) return origThumb.url;
      
      const largeThumb = data.thumbnails.find((t: any) => t.id === 'large');
      if (largeThumb) return largeThumb.url;
      
      return data.thumbnails[data.thumbnails.length - 1].url;
    }
    
    return data.thumbnail || '';
  }
}
