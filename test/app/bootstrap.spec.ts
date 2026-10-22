/**
 * 애플리케이션 부트스트랩 스모크 테스트
 *
 * Mongoose 연결·모델 프로바이더를 가짜로 대체해 DB 연결 없이 AppModule 전체를 기동합니다.
 * 모듈 간 의존성 주입(가드, 전략, HttpModule), 라이프사이클 훅, Swagger 문서 생성,
 * Express 5를 통한 비인증 요청 거부(401)까지 한 번에 검증합니다.
 * (Nest 12 업그레이드 시 가드 의존성 해석 변경을 잡아낸 테스트입니다.)
 */
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import './dummy-env';
import { AppModule } from 'src/app.module';
import { createSwaggerConfig } from 'src/swagger/swagger.setup';
import { withFakeMongoose } from '../helpers/fake-mongoose';
import { CategoriesService } from 'src/categories/categories.service';

/** `test/app/env.ts`의 `JWT_SECRET`으로 Spring과 같은 형식(HS512, `sub`·`auth`)의 토큰을 만든다. */
const signSpringToken = (auth: string, algorithm: 'HS512' | 'HS256' = 'HS512') =>
  new JwtService().sign(
    { sub: 'a@b.c', auth },
    { secret: Buffer.from(process.env.JWT_SECRET!, 'base64'), algorithm, expiresIn: '5m' },
  );

describe('AppModule 기동 (DB 없이)', () => {
  let app: any;
  let document: any;
  let categoriesService: CategoriesService;

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

    categoriesService = moduleRef.get(CategoriesService);
    app = moduleRef.createNestApplication();
    // 문서 설정은 main.ts와 같은 것을 쓰고, 인증 미들웨어(setupSwagger)는 걸지 않는다
    document = SwaggerModule.createDocument(app, createSwaggerConfig());
    SwaggerModule.setup('api/posts/swagger', app, document);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('모든 프로바이더를 해석해 기동한다', () => {
    expect(app).toBeDefined();
  });

  it('Swagger 문서에 posts와 categories 경로가 들어간다', () => {
    const paths = Object.keys(document.paths);
    expect(paths.some((p) => p.startsWith('/api/v1/posts'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/api/v1/categories'))).toBe(true);
    expect(
      Object.keys(document.components?.schemas ?? {}).length,
    ).toBeGreaterThan(0);
  });

  it('모든 엔드포인트의 보안 요구가 등록된 스킴을 가리킨다', () => {
    // @ApiBearerAuth('다른이름')처럼 등록되지 않은 스킴을 쓰면 Swagger UI가 토큰을 붙이지 않는다
    const schemes = Object.keys(document.components?.securitySchemes ?? {});
    const used = Object.values(document.paths)
      .flatMap((item: any) => Object.values(item))
      .flatMap((op: any) => op.security ?? [])
      .flatMap((req: Record<string, string[]>) => Object.keys(req));
    expect(used.length).toBeGreaterThan(0);
    expect([...new Set(used)].filter((s) => !schemes.includes(s))).toEqual([]);
  });

  it('인증 없이 게시글을 만들면 JwtAuthGuard가 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .send({ title: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('NO_AUTH_HEADER');
  });

  it('Swagger JSON을 돌려준다', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/posts/swagger-json',
    );
    expect(res.status).toBe(200); // SwaggerAuthMiddleware는 main.ts에서만 적용되므로 여기서는 200
  });

  describe('관리자 전용 라우트 (JwtAuthGuard + RolesGuard)', () => {
    const CATEGORY_URL = '/api/v1/categories/507f1f77bcf86cd799439011';
    let removeSpy: jest.SpyInstance;

    beforeEach(() => {
      removeSpy = jest.spyOn(categoriesService, 'remove').mockResolvedValue(undefined);
    });

    afterEach(() => {
      removeSpy.mockRestore();
    });

    it.each(['ROLE_ADMIN', 'ADMIN', 'ROLE_USER,ROLE_ADMIN'])(
      'Spring 관리자 토큰(auth=%p)은 카테고리를 삭제할 수 있다',
      async (auth) => {
        const res = await request(app.getHttpServer())
          .delete(CATEGORY_URL)
          .set('Authorization', `Bearer ${signSpringToken(auth)}`);
        expect(res.status).toBe(200);
        expect(removeSpy).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      },
    );

    it('일반 사용자 토큰은 카테고리 삭제가 403', async () => {
      const res = await request(app.getHttpServer())
        .delete(CATEGORY_URL)
        .set('Authorization', `Bearer ${signSpringToken('ROLE_USER')}`);
      expect(res.status).toBe(403);
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('일반 사용자 토큰은 게시글 생성이 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${signSpringToken('ROLE_USER')}`)
        .send({ title: 'x' });
      expect(res.status).toBe(403);
    });

    it('HS512가 아닌 토큰은 관리자 권한이 있어도 401', async () => {
      const res = await request(app.getHttpServer())
        .delete(CATEGORY_URL)
        .set('Authorization', `Bearer ${signSpringToken('ROLE_ADMIN', 'HS256')}`);
      expect(res.status).toBe(401);
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('경로 id 형식 검사 (ParseObjectIdPipe)', () => {
    it.each([
      ['게시글 조회', '/api/v1/posts/', 'invalid-id'],
      ['카테고리 조회', '/api/v1/categories/', 'invalid-id'],
      ['카테고리 조회(12자 문자열)', '/api/v1/categories/', 'aaaaaaaaaaaa'],
    ])('%s: id가 ObjectId가 아니면 400이고 응답에 입력값이 없다', async (_, path, id) => {
      const res = await request(app.getHttpServer()).get(path + id);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain(id);
    });
  });
});
