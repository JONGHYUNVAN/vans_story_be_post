import { Role } from '../role.enum';

/**
 * 인증된 요청의 `request.user`
 *
 * `JwtStrategy.validate`가 만든다.
 */
export interface AuthenticatedUser {
  /** 사용자 이메일 (JWT `sub`) */
  sub: string;
  /** 정규화된 역할. 알 수 없는 권한 문자열은 들어가지 않는다 */
  roles: Role[];
}
