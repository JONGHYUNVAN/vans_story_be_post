/**
 * 역할 기반 접근 제어(RBAC) 가드
 * 
 * 사용자의 역할에 따라 API 접근 권한을 제어하는 가드를 제공합니다.
 * 
 * @module utils/Authorization/Guard/role
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

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
   * @param {ExecutionContext} context - 실행 컨텍스트
   * @returns {boolean} 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // 컨트롤러 또는 핸들러에 설정된 roles 메타데이터 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 만약 별도의 역할 제한이 없다면 접근 허용
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // JwtStrategy의 validate()에서 반환한 값

    // 사용자의 role이 requiredRoles 중 하나와 일치하는지 확인
    return requiredRoles.includes(user.role);
  }
}