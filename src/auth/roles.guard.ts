/**
 * 역할 기반 접근 제어(RBAC) 가드
 * 
 * 사용자의 역할에 따라 API 접근 권한을 제어하는 가드를 제공합니다.
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './role.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

/**
 * 역할 기반 접근 제어 가드
 * 
 * 컨트롤러 또는 라우트 핸들러에 설정된 필수 역할을 기반으로
 * 요청한 사용자의 접근 권한을 검증합니다.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * 사용자의 역할 기반 접근 권한을 검증합니다.
   *
   * `@Roles()`가 없으면 통과합니다. 있으면 `request.user.roles` 중 하나가 일치해야 하고,
   * 사용자 정보가 없으면 거부합니다(`JwtAuthGuard` 뒤에 둬야 합니다). 거부는 403입니다.
   *
   * @param context - 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user: AuthenticatedUser | undefined = context.switchToHttp().getRequest().user;
    return user?.roles?.some((role) => requiredRoles.includes(role)) ?? false;
  }
}