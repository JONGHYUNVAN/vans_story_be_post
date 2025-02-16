import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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