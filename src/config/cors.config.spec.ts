/**
 * CORS 설정 단위 테스트
 *
 * `createCorsOptions`가 `CORS_ORIGINS`를 출처 목록으로 바꾸고, 없으면 로컬 기본값을 쓰는지 확인합니다.
 */
import { ConfigService } from '@nestjs/config';
import { createCorsOptions } from './cors.config';

// 실제 ConfigService는 값이 없으면 process.env로 내려가므로, 셸 환경 변수가 섞이지 않게 주어진 값만 돌려주는 대역을 쓴다
const configWith = (env: Record<string, string>): ConfigService =>
  ({ get: (key: string) => env[key] }) as unknown as ConfigService;

describe('createCorsOptions', () => {
  it('CORS_ORIGINS를 쉼표로 나눠 허용 출처로 쓴다', () => {
    const config = configWith({
      CORS_ORIGINS: 'https://a.example.com,https://b.example.com',
    });

    expect(createCorsOptions(config)).toEqual({
      origin: ['https://a.example.com', 'https://b.example.com'],
      credentials: true,
    });
  });

  it('CORS_ORIGINS가 없으면 http://localhost:3000만 허용한다', () => {
    expect(createCorsOptions(configWith({}))).toEqual({
      origin: ['http://localhost:3000'],
      credentials: true,
    });
  });
});
