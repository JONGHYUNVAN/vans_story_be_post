import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

/**
 * JWT 인증을 처리하는 가드 클래스
 * 
 * HTTP 요청에 대한 JWT 토큰 검증을 수행합니다.
 * 모든 보호된 라우트에 대해 인증을 처리하며, 
 * 유효하지 않은 토큰이나 만료된 토큰에 대한 예외를 발생시킵니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  /**
   * 요청에 대한 인증을 수행합니다.
   * 
   * @param {ExecutionContext} context - 실행 컨텍스트
   * @returns {Promise<boolean> | Observable<boolean>} 인증 성공 여부
   * @throws {UnauthorizedException} 인증 헤더가 없거나 잘못된 경우
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        message: 'Authorization 헤더가 없습니다.',
        error: 'NO_AUTH_HEADER',
        statusCode: 401
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: '잘못된 토큰 형식입니다. Bearer 스키마가 필요합니다.',
        error: 'INVALID_TOKEN_FORMAT',
        statusCode: 401
      });
    }

    return super.canActivate(context);
  }

  /**
   * JWT 전략에서 반환된 결과를 처리합니다.
   * 
   * @param {Error} err - 발생한 오류
   * @param {any} user - 인증된 사용자 정보
   * @param {any} info - JWT 전략에서 반환된 추가 정보
   * @returns {any} 인증된 사용자 정보
   * @throws {UnauthorizedException} 인증 실패 시 발생하는 예외
   */
  handleRequest(err: any, user: any, info: any): any {
    if (info instanceof Error) {
      const errorType = info.name;
      switch (errorType) {
        case 'JsonWebTokenError':
          throw new UnauthorizedException({
            message: '유효하지 않은 토큰입니다.',
            error: 'INVALID_TOKEN',
            statusCode: 401
          });
        case 'TokenExpiredError':
          throw new UnauthorizedException({
            message: '만료된 토큰입니다.',
            error: 'TOKEN_EXPIRED',
            statusCode: 401
          });
        default:
          throw new UnauthorizedException({
            message: '인증에 실패했습니다.',
            error: 'AUTH_FAILED',
            statusCode: 401
          });
      }
    }

    if (err || !user) {
      throw new UnauthorizedException({
        message: '인증에 실패했습니다.',
        error: 'AUTH_FAILED',
        details: err?.message || info?.message,
        statusCode: 401
      });
    }

    return user;
  }
}