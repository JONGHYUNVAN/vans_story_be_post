// 환경 변수 설정을 가장 먼저
process.env.JWT_SECRET = 'dGVzdF9zZWNyZXRfa2V5'; // base64 encoded 'test_secret_key'

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { CreateDto } from '../../../src/modules/post/DTO/dto';
import { MockAuthModule } from '../../helpers/mock.module';
import { JwtAuthGuard } from '../../../src/utils/Authorization/Guard/auth';
import { TestAuthGuard } from '../../helpers/test-auth.guard';
import { InternalApiClient } from '../../../src/utils/Api/api';
import { MockInternalApiClient } from '../../helpers/mock-api.client';
import { MockGenerator } from '../../helpers/mock-generator';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  const testToken = 'Bearer test_token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, MockAuthModule],
    })
    .overrideGuard(JwtAuthGuard)
    .useClass(TestAuthGuard)
    .overrideProvider(InternalApiClient)
    .useClass(MockInternalApiClient)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('게시글 CRUD 테스트', () => {
    let createdPostId: string;

    it('게시글 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', testToken)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('게시글 생성', async () => {
      const createDto = MockGenerator.createMock(CreateDto);

      const response = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', testToken)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(createDto.title);
      createdPostId = response.body._id;
    });

    it('생성된 게시글 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', testToken)
        .expect(200);

      expect(response.body._id).toBe(createdPostId);
    });

    it('게시글 수정', async () => {
      const updateDto = MockGenerator.createMock(CreateDto);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', testToken)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.content).toStrictEqual(updateDto.content);
    });

    it('게시글 삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', testToken)
        .expect(200);

      // 삭제된 게시글 조회 시 404 에러 확인
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', testToken)
        .expect(404);
    });
  });

  describe('게시글 검색 및 필터링 테스트', () => {
    it('테마로 게시글 검색', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', testToken)
        .query({ theme: 'light' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.theme).toBe('light');
      });
    });

    it('카테고리로 게시글 검색', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', testToken)
        .query({ category: 'general' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.category).toBe('general');
      });
    });
  });
}); 