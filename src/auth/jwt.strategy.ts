import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { Role } from './role.enum';

/**
 * Spring 사용자 서비스가 발급하는 JWT의 페이로드
 */
interface JwtPayload {
  /** 사용자 이메일 */
  sub?: unknown;
  /** 쉼표로 이은 권한 문자열 (예: `ROLE_ADMIN`, `ADMIN`, `ROLE_USER,ROLE_ADMIN`) */
  auth?: unknown;
}

const KNOWN_ROLES = new Set<string>(Object.values(Role));

/**
 * JWT 인증 전략을 구현하는 클래스
 *
 * JWT 토큰의 추출 및 검증을 담당하는 Passport 전략을 구현합니다.
 * Authorization 헤더의 Bearer 토큰을 추출하고,
 * 환경 변수에 설정된 비밀 키를 사용하여 토큰을 검증합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * JWT 전략 설정을 초기화합니다.
   *
   * - jwtFromRequest: Authorization 헤더에서 Bearer 토큰을 추출
   * - ignoreExpiration: 토큰 만료 검사 활성화
   * - secretOrKey: 환경 변수에서 JWT 비밀 키를 가져와 base64로 디코딩
   * - algorithms: Spring이 서명하는 HS512만 허용
   */
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(config.getOrThrow<string>('JWT_SECRET'), 'base64'),
      algorithms: ['HS512'],
    });
  }

  /**
   * 검증된 JWT 페이로드를 `request.user`로 바꿉니다.
   *
   * `auth` 클레임의 권한 문자열을 `Role`로 정규화합니다. `ROLE_` 접두사와 대소문자를 무시하고,
   * `Role`에 없는 권한은 버립니다. `sub`가 없으면 `null`을 돌려 인증을 실패시킵니다(401).
   *
   * @param payload - 서명·만료 검증을 통과한 페이로드
   * @returns 인증된 사용자, `sub`가 없으면 `null`
   */
  validate(payload: JwtPayload): AuthenticatedUser | null {
    if (typeof payload.sub !== 'string' || payload.sub === '') {
      return null;
    }
    return { sub: payload.sub, roles: JwtStrategy.toRoles(payload.auth) };
  }

  private static toRoles(auth: unknown): Role[] {
    if (typeof auth !== 'string') {
      return [];
    }
    const roles = auth
      .split(',')
      .map((authority) => authority.trim().replace(/^ROLE_/i, '').toLowerCase())
      .filter((role): role is Role => KNOWN_ROLES.has(role));
    return [...new Set(roles)];
  }
}
