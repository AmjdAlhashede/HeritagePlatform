import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PerformersService } from '../modules/performers/performers.service';
import { Repository } from 'typeorm';
import { Performer } from '../modules/performers/performers.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function fixNames() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const performerRepository = app.get<Repository<Performer>>(getRepositoryToken(Performer));

    const performers = await performerRepository.find();

    console.log('\n🛠️  بدء إصلاح الأسماء...\n');

    for (const p of performers) {
        let newName = p.name;

        // تنظيف الألقاب الشائعة
        newName = newName.replace('الشهيد ', '');
        newName = newName.replace('المجاهد ', '');
        newName = newName.replace('المنشد ', '');
        newName = newName.replace('أبو ', ''); // قد تكون جزء من الاسم، لكن غالباً كنية

        // إذا كان fullName فارغاً، نستخدم الاسم المنظف
        if (!p.fullName) {
            p.fullName = newName.trim();
            p.shortName = newName.trim(); // نحدث الاسم المختصر أيضاً

            await performerRepository.save(p);
            console.log(`✅ تم تحديث: ${p.name} -> ${p.fullName}`);
        } else {
            console.log(`ℹ️  تجاوز: ${p.name} (الاسم الكامل موجود: ${p.fullName})`);
        }
    }

    console.log('\n✅ انتهت العملية!');
    await app.close();
}

fixNames();
