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
});
