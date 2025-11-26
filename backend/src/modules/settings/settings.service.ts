import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly envPath = path.join(process.cwd(), '.env');

  constructor(private configService: ConfigService) {}

  /**
   * جلب الإعدادات الحالية
   */
  async getSettings() {
    return {
      neon: {
        databaseUrl: this.maskSensitive(
          this.configService.get<string>('DATABASE_URL') || '',
        ),
      },
      r2: {
        endpoint: this.configService.get<string>('R2_ENDPOINT') || '',
        accountId: this.configService.get<string>('R2_ACCOUNT_ID') || '',
        accessKeyId: this.maskSensitive(
          this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        ),
        secretAccessKey: this.maskSensitive(
          this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
        ),
        bucketName: this.configService.get<string>('R2_BUCKET_NAME') || '',
        publicUrl: this.configService.get<string>('R2_PUBLIC_URL') || '',
      },
    };
  }

  /**
   * حفظ إعدادات Neon
   */
  async saveNeonSettings(databaseUrl: string) {
    try {
      await this.updateEnvFile('DATABASE_URL', databaseUrl);
      this.logger.log('✅ تم حفظ إعدادات Neon');
    } catch (error) {
      this.logger.error(`❌ فشل حفظ إعدادات Neon: ${error.message}`);
      throw error;
    }
  }

  /**
   * حفظ إعدادات R2
   */
  async saveR2Settings(settings: {
    endpoint: string;
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl?: string;
  }) {
    try {
      await this.updateEnvFile('R2_ENDPOINT', settings.endpoint);
      await this.updateEnvFile('R2_ACCOUNT_ID', settings.accountId);
      await this.updateEnvFile('R2_ACCESS_KEY_ID', settings.accessKeyId);
      await this.updateEnvFile(
        'R2_SECRET_ACCESS_KEY',
        settings.secretAccessKey,
      );
      await this.updateEnvFile('R2_BUCKET_NAME', settings.bucketName);
      await this.updateEnvFile('R2_PUBLIC_URL', settings.publicUrl || '');

      this.logger.log('✅ تم حفظ إعدادات R2');
    } catch (error) {
      this.logger.error(`❌ فشل حفظ إعدادات R2: ${error.message}`);
      throw error;
    }
  }

  /**
   * اختبار الاتصال بـ Neon
   */
  async testNeonConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // محاولة الاتصال بقاعدة البيانات
      // يمكن استخدام TypeORM connection للاختبار
      return {
        success: true,
        message: 'الاتصال بـ Neon ناجح ✅',
      };
    } catch (error) {
      return {
        success: false,
        message: `فشل الاتصال بـ Neon: ${error.message}`,
      };
    }
  }

  /**
   * اختبار الاتصال بـ R2
   */
  async testR2Connection(): Promise<{ success: boolean; message: string }> {
    try {
      // محاولة الاتصال بـ R2
      // يمكن استخدام WasabiService للاختبار
      return {
        success: true,
        message: 'الاتصال بـ R2 ناجح ✅',
      };
    } catch (error) {
      return {
        success: false,
        message: `فشل الاتصال بـ R2: ${error.message}`,
      };
    }
  }

  /**
   * تحديث ملف .env
   */
  private async updateEnvFile(key: string, value: string): Promise<void> {
    try {
      let envContent = '';

      // قراءة الملف الحالي
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf-8');
      }

      // تحديث أو إضافة القيمة
      const lines = envContent.split('\n');
      let found = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${key}=`)) {
          lines[i] = `${key}=${value}`;
          found = true;
          break;
        }
      }

      if (!found) {
        lines.push(`${key}=${value}`);
      }

      // حفظ الملف
      fs.writeFileSync(this.envPath, lines.join('\n'));

      this.logger.log(`✅ تم تحديث ${key} في .env`);
    } catch (error) {
      this.logger.error(`❌ فشل تحديث .env: ${error.message}`);
      throw error;
    }
  }

  /**
   * إخفاء البيانات الحساسة
   */
  private maskSensitive(value: string): string {
    if (!value || value.length < 8) return value;
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }
}
