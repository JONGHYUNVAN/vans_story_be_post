/**
 * CORS 설정
 *
 * `main.ts`가 `app.get(ConfigService)` 뒤에 호출한다. import 시점에는 `.env`가 아직
 * 로드되지 않았을 수 있으므로 값은 상수가 아니라 `ConfigService`를 받는 함수에서 읽는다(CLAUDE.md 함정 5).
 *
 * @module config/cors.config
 */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

/** `CORS_ORIGINS`가 없을 때 허용하는 출처 (로컬 프런트엔드) */
const DEFAULT_ORIGINS = ['http://localhost:3000'];

/**
 * `app.enableCors()`에 넘길 옵션을 만든다.
 *
 * @param config - `CORS_ORIGINS`(쉼표 구분 출처 목록)를 읽을 `ConfigService`
 * @returns 허용 출처와 인증 정보 허용 여부
 */
export function createCorsOptions(config: ConfigService): CorsOptions {
  return {
    origin: config.get<string>('CORS_ORIGINS')?.split(',') || DEFAULT_ORIGINS,
    credentials: true,
  };
}
