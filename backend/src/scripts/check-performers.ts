import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PerformersService } from '../modules/performers/performers.service';

async function checkPerformers() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const performersService = app.get(PerformersService);

    const result = await performersService.findAll(1, 1000);
    const performers = (result as any).data || [];

    console.log('\n📊 قائمة المنشدين:\n');
    performers.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Name (الجهادي): ${p.name}`);
        console.log(`ShortName (المختصر): ${p.shortName || '---'}`);
        console.log(`FullName (الكامل): ${p.fullName || '---'}`);
        console.log('-------------------');
    });

    await app.close();
}

checkPerformers();
