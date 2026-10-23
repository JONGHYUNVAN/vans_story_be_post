import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePostDto } from './create-post.dto';

const validBody = {
  title: '제목',
  content: { type: 'doc', content: [] },
  mainCategoryId: '507f1f77bcf86cd799439011',
  subCategoryId: '507f1f77bcf86cd799439012',
  description: '설명',
  tags: ['nest'],
  topic: '주제',
  language: 'ko',
};

const failedFields = (dtoClass: new () => object, body: object) =>
  validateSync(plainToInstance(dtoClass, body)).map((error) => error.property);

describe('CreatePostDto', () => {
  it('필수 필드가 모두 있으면 통과한다', () => {
    expect(failedFields(CreatePostDto, validBody)).toEqual([]);
  });

  // 스키마 required가 빈 문자열을 거부해 500이 나던 필드
  it.each(['title', 'description', 'topic', 'language'])(
    '%s가 빈 문자열이면 거부한다',
    (field) => {
      expect(
        failedFields(CreatePostDto, { ...validBody, [field]: '' }),
      ).toEqual([field]);
    },
  );
});
