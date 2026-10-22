import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';

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

const failedFields = (dto: new () => object, body: object) =>
  validateSync(plainToInstance(dto, body)).map((error) => error.property);

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

describe('UpdatePostDto', () => {
  it('일부 필드만 보내도 통과한다', () => {
    expect(failedFields(UpdatePostDto, { title: '새 제목' })).toEqual([]);
  });

  it.each(['title', 'description', 'topic', 'language'])(
    '%s가 빈 문자열이면 거부한다',
    (field) => {
      expect(failedFields(UpdatePostDto, { [field]: '' })).toEqual([field]);
    },
  );

  // null은 생략이 아니다 — 필수 필드를 null로 덮어쓰지 못하게 한다
  it.each([
    'title',
    'content',
    'mainCategoryId',
    'subCategoryId',
    'description',
    'tags',
    'topic',
    'language',
  ])('%s를 null로 보내면 거부한다', (field) => {
    expect(failedFields(UpdatePostDto, { [field]: null })).toEqual([field]);
  });

  it('원래 선택 필드인 thumbnail은 null을 받는다', () => {
    expect(failedFields(UpdatePostDto, { thumbnail: null })).toEqual([]);
  });
});
