// 환경 변수 설정을 가장 먼저
process.env.JWT_SECRET = 'dGVzdF9zZWNyZXRfa2V5'; // base64 encoded 'test_secret_key'

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { CreateDto } from '../../../src/modules/post/DTO';
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
      const createDto: CreateDto = MockGenerator.createMock(CreateDto);

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

    it('게시글 수정용 조회 - 작성자 본인', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}/edit`)
        .set('Authorization', testToken)
        .expect(200);

      expect(response.body._id).toBe(createdPostId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('authorEmail');
    });

    it('게시글 수정용 조회 - 인증 없음', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}/edit`)
        .expect(401);
    });

    it('게시글 수정', async () => {
      const updateDto: CreateDto = MockGenerator.createMock(CreateDto);

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

  describe('게시글 권한 테스트', () => {
    let authorPostId: string;
    let otherUserPostId: string;
    const authorToken = 'Bearer author_token';
    const otherUserToken = 'Bearer other_user_token'; 

    beforeAll(async () => {
      // 작성자가 게시글 생성
      const createDto1: CreateDto = MockGenerator.createMock(CreateDto);
      const authorResponse = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', authorToken)
        .send(createDto1)
        .expect(201);
      authorPostId = authorResponse.body._id;

      // 다른 사용자가 게시글 생성
      const createDto2: CreateDto = MockGenerator.createMock(CreateDto);
      const otherResponse = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', otherUserToken)
        .send(createDto2)
        .expect(201);
      otherUserPostId = otherResponse.body._id;
    });

    afterAll(async () => {
      // 테스트 후 생성된 게시글들 정리
      if (authorPostId) {
        await request(app.getHttpServer())
          .delete(`/api/v1/posts/${authorPostId}`)
          .set('Authorization', authorToken);
      }
      if (otherUserPostId) {
        await request(app.getHttpServer())
          .delete(`/api/v1/posts/${otherUserPostId}`)
          .set('Authorization', otherUserToken);
      }
    });

    it('작성자 본인이 자신의 게시글 수정용 조회 - 성공', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${authorPostId}/edit`)
        .set('Authorization', authorToken)
        .expect(200);

      expect(response.body._id).toBe(authorPostId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
    });

    it('다른 사용자가 타인의 게시글 수정용 조회 - 403 에러', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${authorPostId}/edit`)
        .set('Authorization', otherUserToken)
        .expect(403);
    });

    it('작성자 본인이 자신의 게시글 수정 - 성공', async () => {
      const updateDto: CreateDto = MockGenerator.createMock(CreateDto);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${authorPostId}`)
        .set('Authorization', authorToken)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.content).toStrictEqual(updateDto.content);
    });

    it('다른 사용자가 타인의 게시글 수정 시도 - 403 에러', async () => {
      const updateDto: CreateDto = MockGenerator.createMock(CreateDto);

      await request(app.getHttpServer())
        .patch(`/api/v1/posts/${authorPostId}`)
        .set('Authorization', otherUserToken)
        .send(updateDto)
        .expect(403);
    });

    it('존재하지 않는 게시글 수정용 조회 - 404 에러', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';
      
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${nonExistentId}/edit`)
        .set('Authorization', authorToken)
        .expect(404);
    });

    it('잘못된 ID 형식으로 수정용 조회 - 404 에러', async () => {
      const invalidId = 'invalid-id';
      
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${invalidId}/edit`)
        .set('Authorization', authorToken)
        .expect(404);
    });
  });

  describe('게시글 검색 및 필터링 테스트', () => {
    it('메인 카테고리로 게시글 검색', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', testToken)
        .query({ mainCategory: 'light' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.mainCategory).toBe('light');
      });
    });

    it('서브 카테고리로 게시글 검색', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', testToken)
        .query({ subCategory: 'general' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.subCategory).toBe('general');
      });
    });
  });
}); 