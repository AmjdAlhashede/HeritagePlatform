import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import { VercelRequest, VercelResponse } from '@vercel/node';

const server = express();
let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: false }
    );
    
    app.enableCors({
      origin: true,
      credentials: true
    });
    
    app.setGlobalPrefix('api');
    await app.init();
  }
  return server;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const server = await bootstrap();
  return server(req, res);
};
