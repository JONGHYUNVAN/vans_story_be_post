import { Types } from 'mongoose';
import { Category } from 'src/categories/schemas/category.schema';
import { PostSchema } from './post.schema';

describe('PostSchema', () => {
  // ref가 없으면 쿼리 populate가 그 경로를 건너뛰어 응답·검색 인덱스에 카테고리 정보가 빠진다
  it.each(['mainCategoryId', 'subCategoryId'])(
    '%s는 Category를 참조해 populate된다',
    (path) => {
      expect(PostSchema.path(path).options.ref).toBe(Category.name);
    },
  );

  // `type: Types.ObjectId`(bson 클래스)는 @nestjs/mongoose 12에서 Mixed가 되어 문자열이 그대로 저장되고,
  // ObjectId로 비교하는 목록 필터(`?mainCategory=`)에 새 글이 걸리지 않는다 (2026-10-25)
  it.each(['mainCategoryId', 'subCategoryId'])(
    '%s 경로는 ObjectId 타입이다',
    (path) => {
      expect(PostSchema.path(path).instance).toBe('ObjectId');
    },
  );

  it('카테고리 id 문자열은 ObjectId로 캐스팅된다', () => {
    const hex = '69881878744da6629fa629b5';
    const path = PostSchema.path('mainCategoryId') as unknown as {
      cast(value: unknown): unknown;
    };
    const casted = path.cast(hex);
    expect(casted).toBeInstanceOf(Types.ObjectId);
    expect(String(casted)).toBe(hex);
  });
});
