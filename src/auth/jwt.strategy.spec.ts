import { ConfigService } from '@nestjs/config';
import { Role } from './role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const strategy = new JwtStrategy({
    getOrThrow: () => Buffer.from('strategy-spec-secret').toString('base64'),
  } as unknown as ConfigService);

  it.each([
    ['ROLE_ADMIN', [Role.Admin]],
    ['ADMIN', [Role.Admin]],
    ['ROLE_USER', [Role.User]],
    ['USER', [Role.User]],
    ['ROLE_USER,ROLE_ADMIN', [Role.User, Role.Admin]],
    [' ROLE_ADMIN , ROLE_ADMIN ', [Role.Admin]],
  ])('Spring 권한 문자열 %p를 %p로 정규화한다', (auth, roles) => {
    expect(strategy.validate({ sub: 'a@b.c', auth })).toEqual({
      sub: 'a@b.c',
      roles,
    });
  });

  it.each([
    ['알 수 없는 권한', 'ROLE_MANAGER'],
    ['빈 문자열', ''],
    ['auth 없음', undefined],
    ['문자열이 아님', ['ROLE_ADMIN']],
  ])('%s이면 역할이 비어 있다', (_, auth) => {
    expect(strategy.validate({ sub: 'a@b.c', auth })).toEqual({
      sub: 'a@b.c',
      roles: [],
    });
  });

  it.each([
    ['sub 없음', undefined],
    ['빈 sub', ''],
    ['문자열이 아닌 sub', 42],
  ])('%s이면 null을 돌려 인증을 실패시킨다', (_, sub) => {
    expect(strategy.validate({ sub, auth: 'ROLE_ADMIN' })).toBeNull();
  });
});
