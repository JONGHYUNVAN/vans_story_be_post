// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose'],
  });

  // CORS 설정
  app.enableCors({
    origin: process.env.CORS_ORIGINS.split(','),
    credentials: true,
  });

  // Swagger 설정
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
}
bootstrap();
