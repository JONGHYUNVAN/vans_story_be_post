import { TestingModuleBuilder } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Post } from 'src/modules/post/schemas/post.schema';
import { Category } from 'src/modules/category/schemas/category.schema';

/**
 * Mongoose 연결·모델 프로바이더를 가짜로 바꿔 DB 연결 없이 `AppModule`을 기동한다.
 *
 * `overrideModule(MongooseModule)`은 쓰지 않는다. `forRoot()`·`forFeature()`가 돌려주는 동적 모듈 객체는
 * 클래스와 `===`로 비교되므로 일치하지 않고, 실제 연결이 그대로 만들어진다.
 * 연결 프로바이더를 바꾸면 연결 팩토리가 실행되지 않는다. 새 스키마를 추가하면 모델 토큰도 추가한다.
 */
export const withFakeMongoose = (
  builder: TestingModuleBuilder,
  model: object = {},
): TestingModuleBuilder =>
  builder
    .overrideProvider(getConnectionToken())
    .useValue({ close: async () => undefined })
    .overrideProvider(getModelToken(Post.name))
    .useValue(model)
    .overrideProvider(getModelToken(Category.name))
    .useValue(model);
