import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface User {
  sub: string;
  role: string;
}

@Injectable()
export class TestAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    // 인증 헤더가 없으면 인증 실패
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }
    
    // 토큰별로 다른 사용자 정보 설정
    let user: User;
    switch (authHeader) {
      case 'Bearer test_token':
        user = { sub: 'test@example.com', role: 'admin' };
        break;
      case 'Bearer author_token':
        user = { sub: 'author@example.com', role: 'user' };
        break;
      case 'Bearer other_user_token':
        user = { sub: 'other@example.com', role: 'user' };
        break;
      default:
        throw new UnauthorizedException('Invalid token');
    }
    
    request.user = user;
    return true;
  }

  handleRequest<TUser = User>(err: any, user: any, info: any, context: ExecutionContext): TUser {
    const request = context.switchToHttp().getRequest();
    if (err || !request.user) {
      throw new UnauthorizedException('Authentication failed');
    }
    return request.user as TUser;
  }
} 