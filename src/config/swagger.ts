/**
 * Swagger API 문서 설정 파일
 * 
 * NestJS 애플리케이션의 API 문서를 생성하기 위한 Swagger 설정을 정의합니다.
 * 이 모듈은 API 엔드포인트, 요청/응답 스키마, 인증 방식 등을 문서화합니다.
 * 
 * @module config/swagger
 */

import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Swagger 문서 설정 객체
 * 
 * API 문서의 제목, 설명, 버전, 태그 및 인증 방식을 구성합니다.
 * 이 설정은 API 문서의 시각적 표현과 사용성에 영향을 미칩니다.
 * 
 * @property {string} title - API 문서 제목
 * @property {string} description - API 개요 설명
 * @property {string} version - API 버전
 * @property {string[]} tags - API 그룹화를 위한 태그
 * @property {object} security - JWT 기반 인증 설정
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Posts API')
  .setDescription('The posts API description')
  .setVersion('1.0')
  .addTag('posts')
  .addBearerAuth(
    { 
      type: 'http', 
      scheme: 'bearer', 
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'Authorization',
  )
  .build(); 