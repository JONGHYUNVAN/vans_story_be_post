/**
 * 애플리케이션 부트스트랩 스모크 테스트
 *
 * MongooseModule을 가짜 모델 프로바이더로 대체해 DB 연결 없이 AppModule 전체를 기동합니다.
 * 모듈 간 의존성 주입(가드, 전략, HttpModule), 라이프사이클 훅, Swagger 문서 생성,
 * Express 5를 통한 비인증 요청 거부(401)까지 한 번에 검증합니다.
 * (Nest 12 업그레이드 시 가드 의존성 해석 변경을 잡아낸 테스트입니다.)
 */
import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import './env';
import { AppModule } from '../../src/app.module';
import { Post } from '../../src/modules/post/schemas/post.schema';
import { Category } from '../../src/modules/category/schemas/category.schema';

describe('AppModule bootstrap (no DB)', () => {
  let app: any;
  let document: any;

  beforeAll(async () => {
    const fakeModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    @Global()
    @Module({
      providers: [
        { provide: getModelToken(Post.name), useValue: fakeModel },
        { provide: getModelToken(Category.name), useValue: fakeModel },
      ],
      exports: [getModelToken(Post.name), getModelToken(Category.name)],
    })
    class FakeMongooseModule {}

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideModule(MongooseModule)
      .useModule(FakeMongooseModule)
      .compile();

    app = moduleRef.createNestApplication();
    const config = new DocumentBuilder()
      .setTitle('smoke')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/posts/swagger', app, document);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('boots AppModule with all providers resolved', () => {
    expect(app).toBeDefined();
  });

  it('generates a Swagger document covering posts and categories', () => {
    const paths = Object.keys(document.paths);
    expect(paths.some((p) => p.startsWith('/api/v1/posts'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/categories'))).toBe(true);
    expect(
      Object.keys(document.components?.schemas ?? {}).length,
    ).toBeGreaterThan(0);
  });

  it('rejects an unauthenticated POST /api/v1/posts with 401 via JwtAuthGuard', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .send({ title: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('NO_AUTH_HEADER');
  });

  it('serves swagger JSON', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/posts/swagger-json',
    );
    expect(res.status).toBe(200); // SwaggerAuthMiddleware는 main.ts에서만 적용되므로 여기서는 200
  });
});
