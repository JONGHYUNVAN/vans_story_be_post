/**
 * Swagger 설정 단위 테스트
 *
 * DB 없이 더미 컨트롤러 하나로 앱을 띄워 `setupSwagger`가 문서 메타데이터·보안 스킴을 등록하고,
 * `SwaggerAuthMiddleware`가 비밀번호 인증 전에는 문서를 막는지 확인합니다.
 * 실제 컨트롤러 전체에 대한 보안 스킴 검사는 `test/app/bootstrap.spec.ts`에 있습니다.
 */
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import * as express from 'express';
import session from 'express-session';
import request from 'supertest';
import { setupSwagger } from './swagger.setup';

const PASSWORD = 'swagger-test-password';

@Controller('ping')
class PingController {
  @Get()
  @ApiBearerAuth()
  ping() {
    return 'pong';
  }
}

describe('setupSwagger', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    app = moduleRef.createNestApplication();
    // main.ts와 같은 순서: 세션 → JSON 파싱 → Swagger
    app.use(
      session({ secret: 'test', resave: false, saveUninitialized: false }),
    );
    app.use(express.json());
    const config = {
      get: (key: string) =>
        key === 'SWAGGER_ADMIN_PASSWORD' ? PASSWORD : undefined,
    } as unknown as ConfigService;
    document = setupSwagger(app, config);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('문서 메타데이터와 bearer 보안 스킴 하나를 등록한다', () => {
    expect(document.info.title).toBe('VansDevBlog API');
    expect(Object.keys(document.components?.securitySchemes ?? {})).toEqual([
      'bearer',
    ]);
    expect(document.paths['/ping'].get?.security).toEqual([{ bearer: [] }]);
  });

  it('인증 전에는 Swagger JSON 요청을 401로 막는다', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/posts/swagger-json',
    );
    expect(res.status).toBe(401);
  });

  it('비밀번호가 틀리면 401을 돌려준다', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/posts/swagger/auth')
      .send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('비밀번호로 인증한 세션은 Swagger JSON을 받는다', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/posts/swagger/auth')
      .send({ password: PASSWORD })
      .expect(200);

    const res = await agent.get('/api/posts/swagger-json');
    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe('VansDevBlog API');
  });

  it('Swagger 밖의 경로는 인증 없이 통과시킨다', async () => {
    const res = await request(app.getHttpServer()).get('/ping');
    expect(res.status).toBe(200);
  });
});
