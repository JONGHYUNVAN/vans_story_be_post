/**
 * 환경 변수 검증 단위 테스트
 *
 * `validateEnv`가 필수·선택 변수를 검사하고, 문제를 한 번에 모아 던지며,
 * 오류 메시지에 값(비밀일 수 있음)을 넣지 않는지 확인합니다.
 */
import { validateEnv } from 'src/config/env.validation';

const VALID = {
  MONGODB_URI: 'mongodb+srv://user:pw@cluster.example.net/db',
  JWT_SECRET: Buffer.from('env-validation-secret').toString('base64'),
  USER_SERVICE_URL: 'https://users.example.com',
  INTERNAL_API_KEY: 'internal-key',
};

const errorOf = (config: Record<string, unknown>): string => {
  try {
    validateEnv(config);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('validateEnv did not throw');
};

describe('validateEnv', () => {
  it('accepts the required set and passes other keys through', () => {
    const result = validateEnv({ ...VALID, PATH: '/usr/bin' });
    expect(result).toEqual({ ...VALID, PATH: '/usr/bin' });
  });

  it('lists every missing required key in one error', () => {
    const message = errorOf({ INTERNAL_API_KEY: 'k' });
    expect(message).toContain('MONGODB_URI is required');
    expect(message).toContain('JWT_SECRET is required');
    expect(message).toContain('USER_SERVICE_URL is required');
    expect(message).not.toContain('INTERNAL_API_KEY');
  });

  it('treats empty and whitespace-only values as missing', () => {
    expect(errorOf({ ...VALID, INTERNAL_API_KEY: '' })).toContain(
      'INTERNAL_API_KEY is required',
    );
    expect(errorOf({ ...VALID, INTERNAL_API_KEY: '   ' })).toContain(
      'INTERNAL_API_KEY is required',
    );
  });

  it('checks the format of required values', () => {
    const message = errorOf({
      ...VALID,
      MONGODB_URI: 'postgres://db',
      JWT_SECRET: 'not base64!',
      USER_SERVICE_URL: 'ftp://users.example.com',
    });
    expect(message).toContain('MONGODB_URI must start with mongodb://');
    expect(message).toContain('JWT_SECRET must be base64');
    expect(message).toContain('USER_SERVICE_URL must be an http(s) URL');
  });

  it('accepts mongodb:// and URL-safe base64', () => {
    expect(() =>
      validateEnv({
        ...VALID,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/db',
        JWT_SECRET: 'ab-c_d',
      }),
    ).not.toThrow();
  });

  it('skips empty optional values', () => {
    expect(() =>
      validateEnv({
        ...VALID,
        NODE_ENV: '',
        PORT: '',
        CORS_ORIGINS: '',
        SEARCH_SERVICE_URL: '',
      }),
    ).not.toThrow();
  });

  it('checks the format of optional values when set', () => {
    const message = errorOf({
      ...VALID,
      NODE_ENV: 'prod',
      PORT: '70000',
      CORS_ORIGINS: 'https://a.example.com,not-a-url',
      SEARCH_SERVICE_URL: 'search.local',
    });
    expect(message).toContain('NODE_ENV must be one of');
    expect(message).toContain('PORT must be an integer');
    expect(message).toContain('CORS_ORIGINS must be a comma-separated list');
    expect(message).toContain('SEARCH_SERVICE_URL must be an http(s) URL');
  });

  it('rejects a non-integer PORT', () => {
    expect(errorOf({ ...VALID, PORT: '3001.5' })).toContain(
      'PORT must be an integer',
    );
  });

  it('trims each CORS origin', () => {
    const result = validateEnv({
      ...VALID,
      CORS_ORIGINS: ' https://a.example.com , http://localhost:3000 ',
    });
    expect(result.CORS_ORIGINS).toBe(
      'https://a.example.com,http://localhost:3000',
    );
  });

  it('never puts values in the error message', () => {
    const message = errorOf({
      MONGODB_URI: 'leaky-mongo-password',
      JWT_SECRET: 'leaky jwt secret!',
      USER_SERVICE_URL: 'leaky-user-url',
      INTERNAL_API_KEY: 'k',
    });
    expect(message).not.toMatch(/leaky/);
  });
});
