import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { PerformersModule } from './modules/performers/performers.module';
import { ContentModule } from './modules/content/content.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { UsersModule } from './modules/users/users.module';
import { LikesModule } from './modules/likes/likes.module';
import { UploadModule } from './modules/upload/upload.module';
import { SyncModule } from './modules/sync/sync.module';
import { ImportModule } from './modules/import/import.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes in milliseconds
      max: 100, // Maximum number of items in cache
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');

        // إذا كان DATABASE_URL موجود (Neon أو أي سحابة)
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get('NODE_ENV') === 'development', // كن حذراً في الإنتاج
            ssl: {
              rejectUnauthorized: false, // مهم لـ Neon وقواعد البيانات السحابية
            },
          };
        }

        // وإلا استخدم المتغيرات المنفصلة (محلي)
        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD') || '',
          database: configService.get('DATABASE_NAME'),
          autoLoadEntities: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    PerformersModule,
    ContentModule,
    CategoriesModule,
    CommentsModule,
    StreamingModule,
    AnalyticsModule,
    AuthModule,
    AdminModule,
    UsersModule,
    LikesModule,
    UploadModule,
    SyncModule,
    ImportModule,
    SettingsModule,
  ],
})
export class AppModule { }
