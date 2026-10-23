import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateCategoryDto } from './update-category.dto';

const failedFields = (dtoClass: new () => object, body: object) =>
  validateSync(plainToInstance(dtoClass, body)).map((error) => error.property);

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
