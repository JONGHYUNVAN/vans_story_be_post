import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface User {
  sub: string;
  role: string;
}

@Injectable()
export class TestAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      sub: 'test@example.com',
      role: 'admin'
    };
    return true;
  }

  handleRequest<TUser = User>(err: any, user: any, info: any, context: ExecutionContext): TUser {
    return { sub: 'test@example.com', role: 'admin' } as TUser;
  }
} 