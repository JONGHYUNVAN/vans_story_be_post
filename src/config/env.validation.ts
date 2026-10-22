/**
 * 환경 변수 검증
 *
 * `ConfigModule.forRoot({ validate: validateEnv })`가 기동 시 한 번 호출한다.
 * 문제를 모두 모아 한 번에 던지고, 메시지에는 변수 이름과 이유만 넣는다 — 값은 비밀일 수 있으므로 넣지 않는다.
 * 새 변수를 추가하면 여기와 `.env.example`에 같이 추가한다.
 *
 * @module config/env.validation
 */

/** 문제가 있으면 이유를, 없으면 `null`을 돌려준다. */
type Check = (value: string) => string | null;

const httpUrl: Check = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:'
      ? null
      : 'must be an http(s) URL';
  } catch {
    return 'must be an http(s) URL';
  }
};

const mongoUri: Check = (value) =>
  /^mongodb(\+srv)?:\/\/.+/.test(value)
    ? null
    : 'must start with mongodb:// or mongodb+srv://';

/** Spring이 쓰는 표준 base64와 URL-safe base64를 모두 받는다. */
const base64: Check = (value) =>
  /^[A-Za-z0-9+/_-]+={0,2}$/.test(value) &&
  Buffer.from(value, 'base64').length > 0
    ? null
    : 'must be base64';

const port: Check = (value) => {
  const n = Number(value);
  return /^\d+$/.test(value) && n >= 1 && n <= 65535
    ? null
    : 'must be an integer between 1 and 65535';
};

const oneOf =
  (...allowed: string[]): Check =>
  (value) =>
    allowed.includes(value) ? null : `must be one of ${allowed.join(', ')}`;

const httpUrlList: Check = (value) => {
  const bad = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => httpUrl(origin) !== null);
  return bad.length === 0
    ? null
    : 'must be a comma-separated list of http(s) URLs';
};

/** 필수 변수. 비어 있으면 누락으로 본다. */
const REQUIRED: Record<string, Check | null> = {
  MONGODB_URI: mongoUri,
  JWT_SECRET: base64,
  USER_SERVICE_URL: httpUrl,
  INTERNAL_API_KEY: null,
};

/** 선택 변수. 비어 있으면 검사하지 않는다(코드가 기본값을 쓴다). */
const OPTIONAL: Record<string, Check> = {
  NODE_ENV: oneOf('development', 'production', 'test'),
  PORT: port,
  CORS_ORIGINS: httpUrlList,
  SEARCH_SERVICE_URL: httpUrl,
};

/**
 * 환경 변수를 검증하고 정규화한 설정을 돌려준다.
 *
 * - 필수: `MONGODB_URI`, `JWT_SECRET`(base64), `USER_SERVICE_URL`, `INTERNAL_API_KEY`
 * - 선택: `NODE_ENV`, `PORT`, `CORS_ORIGINS`, `SEARCH_SERVICE_URL` (`SWAGGER_ADMIN_PASSWORD`는 비면 Swagger 로그인 불가라 검사하지 않는다)
 * - `CORS_ORIGINS`는 항목마다 앞뒤 공백을 지운다
 *
 * @param config `.env`와 `process.env`를 합친 값
 * @returns 검증된 설정. `ConfigService`와 `process.env`에 반영된다
 * @throws {Error} 하나라도 문제가 있으면 전부 나열해 던진다
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];
  const read = (key: string): string => {
    const value = config[key];
    return typeof value === 'string' ? value.trim() : '';
  };

  for (const [key, check] of Object.entries(REQUIRED)) {
    const value = read(key);
    const problem = value === '' ? 'is required' : check?.(value);
    if (problem) errors.push(`${key} ${problem}`);
  }
  for (const [key, check] of Object.entries(OPTIONAL)) {
    const value = read(key);
    const problem = value === '' ? null : check(value);
    if (problem) errors.push(`${key} ${problem}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment variables:\n${errors.map((e) => `- ${e}`).join('\n')}`,
    );
  }

  const cors = read('CORS_ORIGINS');
  return cors === ''
    ? config
    : {
        ...config,
        CORS_ORIGINS: cors
          .split(',')
          .map((origin) => origin.trim())
          .join(','),
      };
}
