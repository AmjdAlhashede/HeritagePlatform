import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ContentService } from '../modules/content/content.service';
import { Repository } from 'typeorm';
import { Content } from '../modules/content/content.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function cleanupContent() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const contentService = app.get(ContentService);
    const contentRepository = app.get<Repository<Content>>(getRepositoryToken(Content));

    console.log('🔍 بحث عن المقاطع للحذف...\n');

    try {
        // جلب كل المحتوى مباشرة من Repository
        const allContent = await contentRepository.find({
            relations: ['performer'],
        });

        // فلترة المقاطع حسب الشرط
        const contentToDelete = allContent.filter((content) => {
            const duration = content.duration;
            return duration < 60 || duration > 600; // أقل من دقيقة أو أكبر من 10 دقائق
        });

        console.log(`📊 إجمالي المقاطع: ${allContent.length}`);
        console.log(`❌ مقاطع للحذف: ${contentToDelete.length}\n`);

        if (contentToDelete.length === 0) {
            console.log('✅ لا توجد مقاطع للحذف!');
            await app.close();
            return;
        }

        // عرض المقاطع للحذف
        console.log('📋 المقاطع التي سيتم حذفها:\n');
        contentToDelete.forEach((content, index) => {
            const minutes = Math.floor(content.duration / 60);
            const seconds = content.duration % 60;
            console.log(
                `${index + 1}. ${content.title} (${minutes}:${seconds.toString().padStart(2, '0')})`
            );
        });

        // حذف فوري بدون انتظار
        // await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('🗑️  بدء عملية الحذف...\n');

        let deletedCount = 0;
        let failedCount = 0;

        for (const content of contentToDelete) {
            try {
                console.log(`⏳ حذف: ${content.title}...`);

                // حذف من قاعدة البيانات
                await contentService.remove(content.id);

                deletedCount++;
                console.log(`✅ تم الحذف بنجاح`);
            } catch (error) {
                failedCount++;
                console.error(`❌ فشل الحذف: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ تم الحذف بنجاح: ${deletedCount}`);
        console.log(`❌ فشل الحذف: ${failedCount}`);
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('❌ خطأ:', error);
    } finally {
        await app.close();
    }
}

// تشغيل السكريبت
cleanupContent()
    .then(() => {
        console.log('✅ انتهت عملية التنظيف!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ خطأ فادح:', error);
        process.exit(1);
    });
