import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

const validBody = {
  value: 'nextjs',
  label: 'Next.js',
  path: '/post/view/nextjs',
};

const failedFields = (dtoClass: new () => object, body: object) =>
  validateSync(plainToInstance(dtoClass, body)).map((error) => error.property);

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
