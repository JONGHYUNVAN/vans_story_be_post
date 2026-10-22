/**
 * 애플리케이션 부트스트랩 스모크 테스트
 *
 * Mongoose 연결·모델 프로바이더를 가짜로 대체해 DB 연결 없이 AppModule 전체를 기동합니다.
 * 모듈 간 의존성 주입(가드, 전략, HttpModule), 라이프사이클 훅, Swagger 문서 생성,
 * Express 5를 통한 비인증 요청 거부(401)까지 한 번에 검증합니다.
 * (Nest 12 업그레이드 시 가드 의존성 해석 변경을 잡아낸 테스트입니다.)
 */
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import './env';
import { AppModule } from '../../src/app.module';
import { withFakeMongoose } from '../helpers/fake-mongoose';
import { CategoryService } from '../../src/modules/category/service/category.service';

/** `test/app/env.ts`의 `JWT_SECRET`으로 Spring과 같은 형식(HS512, `sub`·`auth`)의 토큰을 만든다. */
const token = (auth: string, algorithm: 'HS512' | 'HS256' = 'HS512') =>
  new JwtService().sign(
    { sub: 'a@b.c', auth },
    { secret: Buffer.from(process.env.JWT_SECRET!, 'base64'), algorithm, expiresIn: '5m' },
  );

describe('AppModule bootstrap (no DB)', () => {
  let app: any;
  let document: any;
  let categoryService: CategoryService;

  beforeAll(async () => {
    const fakeModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const moduleRef = await withFakeMongoose(
      Test.createTestingModule({ imports: [AppModule] }),
      fakeModel,
    ).compile();

    categoryService = moduleRef.get(CategoryService);
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

  describe('관리자 전용 라우트 (JwtAuthGuard + RolesGuard)', () => {
    const CATEGORY_URL = '/api/v1/categories/507f1f77bcf86cd799439011';
    let remove: jest.SpyInstance;

    beforeEach(() => {
      remove = jest.spyOn(categoryService, 'remove').mockResolvedValue(undefined);
    });

    afterEach(() => {
      remove.mockRestore();
    });

    it.each(['ROLE_ADMIN', 'ADMIN', 'ROLE_USER,ROLE_ADMIN'])(
      'Spring 관리자 토큰(auth=%p)은 카테고리를 삭제할 수 있다',
      async (auth) => {
        const res = await request(app.getHttpServer())
          .delete(CATEGORY_URL)
          .set('Authorization', `Bearer ${token(auth)}`);
        expect(res.status).toBe(200);
        expect(remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      },
    );

    it('일반 사용자 토큰은 카테고리 삭제가 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(CATEGORY_URL)
        .set('Authorization', `Bearer ${token('ROLE_USER')}`);
      expect(res.status).toBe(403);
      expect(remove).not.toHaveBeenCalled();
    });

    it('일반 사용자 토큰은 게시글 생성이 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token('ROLE_USER')}`)
        .send({ title: 'x' });
      expect(res.status).toBe(403);
    });

    it('HS512가 아닌 토큰은 관리자 권한이 있어도 401', async () => {
      const res = await request(app.getHttpServer())
        .delete(CATEGORY_URL)
        .set('Authorization', `Bearer ${token('ROLE_ADMIN', 'HS256')}`);
      expect(res.status).toBe(401);
      expect(remove).not.toHaveBeenCalled();
    });
  });
});
