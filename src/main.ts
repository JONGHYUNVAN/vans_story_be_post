/**
 * 애플리케이션 진입점
 * 
 * NestJS 애플리케이션을 부트스트랩하고 필요한 미들웨어 및 설정을 구성합니다.
 * 
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as session from 'express-session';
import { Logger } from '@nestjs/common';
import { SwaggerAuthMiddleware } from './middleware/swagger.auth.middleware';
import { ValidationPipe } from '@nestjs/common';

/**
 * 애플리케이션 부트스트랩 함수
 * 
 * NestJS 애플리케이션을 초기화하고 미들웨어, Swagger, CORS 등을 설정합니다.
 * 환경 변수를 기반으로 애플리케이션 구성을 조정합니다.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose'],
  });

  // 전역 밸리데이션 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 요청 거부
    transform: true, // 요청 데이터를 DTO 클래스의 인스턴스로 변환
    transformOptions: {
      enableImplicitConversion: true, // 암시적 타입 변환 활성화
    },
    validationError: {
      target: false, // 에러 객체에서 target 제외
      value: false, // 에러 객체에서 value 제외
    },
  }));

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
  
  // Swagger 문서 설정
  const config = new DocumentBuilder()
    .setTitle('VansDevBlog API')
    .setDescription('VansDevBlog Post Service API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/posts/swagger', app, document);

  // 서버 시작
  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
}
bootstrap();
