import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';

const validBody = {
  value: 'nextjs',
  label: 'Next.js',
  path: '/post/view/nextjs',
};

const failedFields = (dto: new () => object, body: object) =>
  validateSync(plainToInstance(dto, body)).map((error) => error.property);

describe('CreateCategoryDto', () => {
  it('필수 필드가 모두 있으면 통과한다', () => {
    expect(failedFields(CreateCategoryDto, validBody)).toEqual([]);
  });

  it.each(['value', 'label', 'path'])(
    '%s가 빈 문자열이면 거부한다',
    (field) => {
      expect(
        failedFields(CreateCategoryDto, { ...validBody, [field]: '' }),
      ).toEqual([field]);
    },
  );

  it('group은 CategoryGroup 값만 받는다', () => {
    expect(
      failedFields(CreateCategoryDto, { ...validBody, group: 'Backend' }),
    ).toEqual([]);
    expect(
      failedFields(CreateCategoryDto, { ...validBody, group: 'backend' }),
    ).toEqual(['group']);
    expect(
      failedFields(CreateCategoryDto, { ...validBody, group: 'Mobile' }),
    ).toEqual(['group']);
  });
});

describe('UpdateCategoryDto', () => {
  it.each(['value', 'label', 'path'])(
    '%s를 null로 보내면 거부한다',
    (field) => {
      expect(failedFields(UpdateCategoryDto, { [field]: null })).toEqual([
        field,
      ]);
    },
  );

  it('parentId는 null(메인 카테고리로 변경)을 받는다', () => {
    expect(failedFields(UpdateCategoryDto, { parentId: null })).toEqual([]);
  });
});
