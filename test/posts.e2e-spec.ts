// 환경 변수 설정을 가장 먼저
process.env.JWT_SECRET = 'dGVzdF9zZWNyZXRfa2V5'; // base64 encoded 'test_secret_key'

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { CreatePostDto, UpdatePostDto } from 'src/posts/dto';
import { Post } from 'src/posts/schemas/post.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FakeJwtAuthGuard } from './helpers/fake-jwt-auth.guard';
import { UserServiceClient } from 'src/user-service/user-service.client';
import { FakeUserServiceClient } from './helpers/fake-user-service.client';
import { createValidDto } from './helpers/dto-fixtures';
import { MAIN_CATEGORY_ID, SUB_CATEGORY_ID } from './helpers/post-fixtures';
import { Category } from 'src/categories/schemas/category.schema';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let postModel: Model<Post>;
  let categoryModel: Model<Category>;
  const adminToken = 'Bearer admin_token';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtAuthGuard)
    .overrideProvider(UserServiceClient)
    .useClass(FakeUserServiceClient)
    .compile();

    postModel = moduleRef.get(getModelToken(Post.name));
    app = moduleRef.createNestApplication();
    await app.init();

    // 게시글 생성은 카테고리 존재를 확인한다 — createValidDto가 쓰는 고정 id로 테스트 카테고리를 만든다
    categoryModel = moduleRef.get(getModelToken(Category.name));
    const suffix = Date.now();
    await categoryModel.create([
      { _id: MAIN_CATEGORY_ID, parentId: null, value: `e2e-main-${suffix}`, label: 'e2e main', path: `/e2e/main-${suffix}` },
      { _id: SUB_CATEGORY_ID, parentId: MAIN_CATEGORY_ID, value: `e2e-sub-${suffix}`, label: 'e2e sub', path: `/e2e/sub-${suffix}` },
    ]);
  });

  afterAll(async () => {
    await categoryModel?.deleteMany({ _id: { $in: [MAIN_CATEGORY_ID, SUB_CATEGORY_ID] } });
    await app.close();
  });

  describe('관리자의 게시글 CRUD', () => {
    let createdPostId: string;

    it('목록은 data와 meta를 돌려준다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', adminToken)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('관리자는 게시글을 만들 수 있다(201)', async () => {
      const createPostDto = createValidDto(CreatePostDto);

      const response = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', adminToken)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(createPostDto.title);
      createdPostId = response.body._id;
    });

    it('만든 게시글을 id로 조회한다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body._id).toBe(createdPostId);
    });

    it('작성자는 수정용 조회가 된다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}/edit`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body._id).toBe(createdPostId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('authorEmail');
    });

    it('인증 없이 수정용 조회는 401', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}/edit`)
        .expect(401);
    });

    it('작성자는 게시글을 수정할 수 있다', async () => {
      const updatePostDto = createValidDto(UpdatePostDto);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', adminToken)
        .send(updatePostDto)
        .expect(200);

      expect(response.body.title).toBe(updatePostDto.title);
      expect(response.body.content).toStrictEqual(updatePostDto.content);
    });

    it('관리자가 지운 게시글은 이후 조회가 404', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', adminToken)
        .expect(200);

      // 삭제된 게시글 조회 시 404 에러 확인
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', adminToken)
        .expect(404);
    });
  });

  describe('일반 사용자 권한', () => {
    let authorPostId: string;
    const authorToken = 'Bearer author_token';
    const otherUserToken = 'Bearer other_user_token';

    beforeAll(async () => {
      // 게시글 생성은 관리자 전용이라, 일반 사용자(author)의 글은 모델로 직접 만든다
      const created = await postModel.create({
        ...createValidDto(CreatePostDto),
        authorEmail: 'author@example.com',
      });
      authorPostId = created._id.toString();
    });

    afterAll(async () => {
      if (authorPostId) {
        await postModel.deleteOne({ _id: authorPostId });
      }
    });

    it('일반 사용자가 게시글을 만들면 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', authorToken)
        .send(createValidDto(CreatePostDto))
        .expect(403);
    });

    it('일반 사용자는 자기 글이어도 지우면 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/posts/${authorPostId}`)
        .set('Authorization', authorToken)
        .expect(403);
    });

    it('작성자는 자기 글의 수정용 조회가 된다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/posts/${authorPostId}/edit`)
        .set('Authorization', authorToken)
        .expect(200);

      expect(response.body._id).toBe(authorPostId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
    });

    it('작성자가 아니면 수정용 조회가 403', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${authorPostId}/edit`)
        .set('Authorization', otherUserToken)
        .expect(403);
    });

    it('작성자는 자기 글을 수정할 수 있다', async () => {
      const updatePostDto = createValidDto(UpdatePostDto);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${authorPostId}`)
        .set('Authorization', authorToken)
        .send(updatePostDto)
        .expect(200);

      expect(response.body.title).toBe(updatePostDto.title);
      expect(response.body.content).toStrictEqual(updatePostDto.content);
    });

    it('작성자가 아니면 수정이 403', async () => {
      const updatePostDto = createValidDto(UpdatePostDto);

      await request(app.getHttpServer())
        .patch(`/api/v1/posts/${authorPostId}`)
        .set('Authorization', otherUserToken)
        .send(updatePostDto)
        .expect(403);
    });

    it('없는 게시글의 수정용 조회는 404', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';
      
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${nonExistentId}/edit`)
        .set('Authorization', authorToken)
        .expect(404);
    });

    it('id 형식이 틀리면 수정용 조회가 400', async () => {
      const invalidId = 'invalid-id';
      
      await request(app.getHttpServer())
        .get(`/api/v1/posts/${invalidId}/edit`)
        .set('Authorization', authorToken)
        .expect(400);
    });
  });

  describe('목록 카테고리 필터', () => {
    it('메인 카테고리 value로 거른다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', adminToken)
        .query({ mainCategory: 'light' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.mainCategory).toBe('light');
      });
    });

    it('서브 카테고리 value로 거른다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('Authorization', adminToken)
        .query({ subCategory: 'general' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(post => {
        expect(post.subCategory).toBe('general');
      });
    });
  });
}); 