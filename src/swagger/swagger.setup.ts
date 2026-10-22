/**
 * Swagger 문서 설정
 *
 * 문서 메타데이터와 `/api/posts/swagger` 등록, 그 앞단의 `SwaggerAuthMiddleware`를 한곳에 둔다.
 *
 * @module swagger/swagger.setup
 */

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { SwaggerAuthMiddleware } from './swagger-auth.middleware';

/**
 * 문서 메타데이터를 만든다.
 *
 * 보안 스킴은 `addBearerAuth()` 기본 이름(`bearer`) 하나다. 컨트롤러는 `@ApiBearerAuth()`를 인자 없이 쓴다.
 *
 * @returns `SwaggerModule.createDocument`에 넘길 설정
 */
export function createSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('VansDevBlog API')
    .setDescription('VansDevBlog Post Service API description')
    .setVersion('1.0')
    .addTag('api/v1/posts', 'Posts API')
    .addTag('api/v1/categories', 'Categories API')
    .addBearerAuth()
    .build();
}

/**
 * Swagger 인증 미들웨어와 문서를 앱에 등록한다.
 *
 * 미들웨어가 `req.session`과 `req.body`를 읽으므로 express-session·`express.json` 뒤에 호출한다.
 *
 * @param app - 부트스트랩 중인 앱
 * @param config - `SWAGGER_ADMIN_PASSWORD`를 읽을 `ConfigService`
 * @returns 생성된 OpenAPI 문서
 */
export function setupSwagger(
  app: INestApplication,
  config: ConfigService,
): OpenAPIObject {
  // `use`는 화살표 속성이라 바인딩 없이 넘겨도 된다(CLAUDE.md 함정 7)
  app.use(new SwaggerAuthMiddleware(config).use);

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup('api/posts/swagger', app, document);
  return document;
}
