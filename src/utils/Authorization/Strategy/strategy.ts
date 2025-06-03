import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
   */
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(process.env.JWT_SECRET, 'base64')
    });
  }

  /**
   * JWT 페이로드를 검증하고 사용자 정보를 추출합니다.
   * 
   * 토큰의 페이로드에서 이메일(sub)과 권한(auth) 정보를 추출하여 반환합니다.
   * 이 정보는 Request 객체의 user 속성으로 주입됩니다.
   * 
   * @param {any} payload - JWT 토큰에서 추출된 페이로드
   * @returns {Promise<{email: string, role: string}>} 검증된 사용자 정보
   * 
   * @example
   * // JWT 페이로드 예시
   * {
   *   "sub": "user@example.com",
   *   "auth": "user",
   *   "iat": 1516239022
   * }
   */
  async validate(payload: any) {
    return { sub: payload.sub, role: payload.auth };
  }
}