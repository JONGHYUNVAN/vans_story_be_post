/**
 * 이 서비스가 쓰는 사용자 역할
 *
 * 토큰의 권한 문자열(Spring의 `ROLE_ADMIN`, `ADMIN` 등)은 `JwtStrategy`가 이 값으로 정규화한다.
 * 컨트롤러·서비스는 외부 권한 문자열을 직접 비교하지 않고 이 enum만 쓴다.
 */
export enum Role {
  User = 'user',
  Admin = 'admin',
}
