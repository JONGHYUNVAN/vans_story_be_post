import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdatePostDto } from './update-post.dto';

const failedFields = (dtoClass: new () => object, body: object) =>
  validateSync(plainToInstance(dtoClass, body)).map((error) => error.property);

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
