import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

class TestController {
  @Roles(Role.Admin)
  adminOnly() {}

  open() {}
}

const contextFor = (
  handler: keyof TestController,
  user?: unknown,
): ExecutionContext =>
  ({
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('@Roles가 없는 라우트는 사용자와 상관없이 통과한다', () => {
    expect(guard.canActivate(contextFor('open'))).toBe(true);
  });

  it('요구 역할이 있으면 통과한다', () => {
    const user = { email: 'a@b.c', roles: [Role.User, Role.Admin] };
    expect(guard.canActivate(contextFor('adminOnly', user))).toBe(true);
  });

  it.each([
    ['요구 역할이 없는 사용자', { email: 'a@b.c', roles: [Role.User] }],
    ['역할이 빈 사용자', { email: 'a@b.c', roles: [] }],
    ['옛 형식(role 문자열)의 사용자', { email: 'a@b.c', role: 'admin' }],
    ['사용자 정보 없음', undefined],
  ])('%s는 거부한다', (_, user) => {
    expect(guard.canActivate(contextFor('adminOnly', user))).toBe(false);
  });
});
