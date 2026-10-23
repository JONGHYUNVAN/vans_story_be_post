import { CategoryGroup } from '../category-group.enum';
import { CategorySchema } from './category.schema';

describe('CategorySchema', () => {
  it('group은 CategoryGroup 값만 저장한다', () => {
    expect(CategorySchema.path('group').options.enum).toEqual(
      Object.values(CategoryGroup),
    );
  });
});
