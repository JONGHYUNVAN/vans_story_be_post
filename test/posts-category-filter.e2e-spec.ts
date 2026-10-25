// 환경 변수 설정을 가장 먼저
process.env.JWT_SECRET = 'dGVzdF9zZWNyZXRfa2V5';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { CreatePostDto } from 'src/posts/dto';
import { Post } from 'src/posts/schemas/post.schema';
import { Category } from 'src/categories/schemas/category.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FakeJwtAuthGuard } from './helpers/fake-jwt-auth.guard';
import { UserServiceClient } from 'src/user-service/user-service.client';
import { FakeUserServiceClient } from './helpers/fake-user-service.client';
import { createValidDto } from './helpers/dto-fixtures';

/** 목록 응답에서 `_id`만 뽑는다 */
const idsOf = (body: { data: { _id: string }[] }) =>
  body.data.map((post) => post._id);

/**
 * API로 만든 게시글이 카테고리 value 필터 목록에 나와야 한다.
 * 2026-10-25 운영에서 새 글이 `?mainCategory=` 목록에서 빠진 회귀 테스트 —
 * 카테고리 id가 ObjectId가 아니라 문자열로 저장되면 ObjectId 필터에 걸리지 않는다.
 */
describe('PostsController 카테고리 필터 (e2e)', () => {
  let app: INestApplication;
  let postModel: Model<Post>;
  let categoryModel: Model<Category>;
  const adminToken = 'Bearer admin_token';

  const mainId = new Types.ObjectId();
  const subId = new Types.ObjectId();
  const suffix = Date.now();
  const mainValue = `filter-main-${suffix}`;
  const subValue = `filter-sub-${suffix}`;
  let createdPostId: string;

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
    categoryModel = moduleRef.get(getModelToken(Category.name));
    app = moduleRef.createNestApplication();
    await app.init();

    await categoryModel.create([
      {
        _id: mainId,
        parentId: null,
        value: mainValue,
        label: 'filter main',
        path: `/f/${mainValue}`,
      },
      {
        _id: subId,
        parentId: mainId,
        value: subValue,
        label: 'filter sub',
        path: `/f/${subValue}`,
      },
    ]);
  });

  afterAll(async () => {
    if (createdPostId) await postModel.deleteOne({ _id: createdPostId });
    await categoryModel.deleteMany({ _id: { $in: [mainId, subId] } });
    await app.close();
  });

  it('API로 만든 글의 카테고리 id는 ObjectId로 저장된다', async () => {
    const dto = createValidDto(CreatePostDto, {
      mainCategoryId: mainId.toHexString(),
      subCategoryId: subId.toHexString(),
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', adminToken)
      .send(dto)
      .expect(201);
    createdPostId = res.body._id;

    const raw = await postModel.collection.findOne({
      _id: new Types.ObjectId(createdPostId),
    });
    expect(raw?.mainCategoryId).toBeInstanceOf(Types.ObjectId);
    expect(raw?.subCategoryId).toBeInstanceOf(Types.ObjectId);
  });

  it('메인 카테고리 value로 거르면 새 글이 나온다', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/posts')
      .query({ mainCategory: mainValue })
      .expect(200);
    expect(idsOf(res.body)).toContain(createdPostId);
  });

  it('메인+서브 카테고리 value로 거르면 새 글이 나온다', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/posts')
      .query({ mainCategory: mainValue, subCategory: subValue })
      .expect(200);
    expect(idsOf(res.body)).toContain(createdPostId);
  });

  it('API로 만든 서브 카테고리의 parentId도 ObjectId로 저장된다', async () => {
    const value = `filter-sub2-${suffix}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', adminToken)
      .send({
        parentId: mainId.toHexString(),
        value,
        label: 'filter sub2',
        path: `/f/${value}`,
      })
      .expect(201);
    const createdId: string = res.body.id;
    const raw = await categoryModel.collection.findOne({
      _id: new Types.ObjectId(createdId),
    });
    await categoryModel.deleteOne({ _id: createdId });
    expect(raw?.parentId).toBeInstanceOf(Types.ObjectId);
  });
});
