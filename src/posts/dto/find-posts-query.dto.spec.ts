import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FindPostsQueryDto, MAX_POSTS_PER_PAGE } from './find-posts-query.dto';

// 쿼리 문자열은 모두 문자열로 들어온다
const parse = (query: Record<string, string>) => {
  const dto = plainToInstance(FindPostsQueryDto, query);
  return { dto, failed: validateSync(dto).map((error) => error.property) };
};

describe('FindPostsQueryDto', () => {
  it('아무것도 없으면 page 1, limit 10', () => {
    const { dto, failed } = parse({});
    expect(failed).toEqual([]);
    expect(dto).toMatchObject({ page: 1, limit: 10 });
  });

  it('숫자 문자열을 숫자로 바꾼다', () => {
    const { dto, failed } = parse({
      page: '3',
      limit: String(MAX_POSTS_PER_PAGE),
      mainCategory: 'light',
    });
    expect(failed).toEqual([]);
    expect(dto).toMatchObject({
      page: 3,
      limit: MAX_POSTS_PER_PAGE,
      mainCategory: 'light',
    });
  });

  it.each([
    ['limit 상한 초과', { limit: String(MAX_POSTS_PER_PAGE + 1) }, 'limit'],
    ['limit 10만', { limit: '100000' }, 'limit'],
    ['limit 0', { limit: '0' }, 'limit'],
    ['숫자가 아닌 page (예전에는 NaN으로 통과)', { page: 'abc' }, 'page'],
    ['빈 page', { page: '' }, 'page'],
    ['소수 page', { page: '1.5' }, 'page'],
    ['음수 page', { page: '-1' }, 'page'],
  ])('%s는 거부한다', (_, query, field) => {
    expect(parse(query).failed).toEqual([field]);
  });
});
