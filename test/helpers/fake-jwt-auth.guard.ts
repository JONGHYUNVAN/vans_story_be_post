import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { Role } from 'src/auth/role.enum';

/** 고정 토큰 문자열 → `request.user` (e2e에서 `JwtAuthGuard` 대신 쓴다) */
const USERS_BY_AUTHORIZATION: Record<string, AuthenticatedUser> = {
  'Bearer admin_token': { email: 'admin@example.com', roles: [Role.Admin] },
  'Bearer author_token': { email: 'author@example.com', roles: [Role.User] },
  'Bearer other_user_token': { email: 'other@example.com', roles: [Role.User] },
};

/**
 * e2e용 `JwtAuthGuard` 대체
 *
 * JWT를 검증하지 않고 `Authorization` 헤더 값으로 사용자를 정한다. 헤더가 없거나 모르는 값이면 401.
 */
@Injectable()
export class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization: string | undefined = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const user = USERS_BY_AUTHORIZATION[authorization];
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = user;
    return true;
  }
}
