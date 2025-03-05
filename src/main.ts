// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as session from 'express-session';
import { Logger } from '@nestjs/common';
import { SwaggerAuthMiddleware } from './middleware/swagger.auth.middleware';

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

  // 세션 설정
  app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));

  // JSON 파싱 미들웨어
  app.use(express.json());

  // Swagger 인증 미들웨어 적용
  app.use(new SwaggerAuthMiddleware().use);
  
  const config = new DocumentBuilder()
    .setTitle('VansDevBlog API')
    .setDescription('VansDevBlog Post Service API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/posts/swagger', app, document);

  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
}
bootstrap();
