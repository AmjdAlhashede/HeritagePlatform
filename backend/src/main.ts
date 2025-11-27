import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Serve test player
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/test/',
  });
  
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://admin.heritage.orbiscodes.online',
      'https://heritage.orbiscodes.online',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces
  
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📱 Mobile access: http://192.168.8.64:${port}`);
  console.log(`📚 API available at http://localhost:${port}/api`);
}

bootstrap();
