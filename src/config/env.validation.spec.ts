/**
 * 환경 변수 검증 단위 테스트
 *
 * `validateEnv`가 필수·선택 변수를 검사하고, 문제를 한 번에 모아 던지며,
 * 오류 메시지에 값(비밀일 수 있음)을 넣지 않는지 확인합니다.
 */
import { validateEnv } from './env.validation';

const VALID_ENV = {
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
  it('필수 값이 모두 있으면 통과하고 다른 키는 그대로 넘긴다', () => {
    const result = validateEnv({ ...VALID_ENV, PATH: '/usr/bin' });
    expect(result).toEqual({ ...VALID_ENV, PATH: '/usr/bin' });
  });

  it('빠진 필수 키를 오류 하나에 모두 적는다', () => {
    const message = errorOf({ INTERNAL_API_KEY: 'k' });
    expect(message).toContain('MONGODB_URI is required');
    expect(message).toContain('JWT_SECRET is required');
    expect(message).toContain('USER_SERVICE_URL is required');
    expect(message).not.toContain('INTERNAL_API_KEY');
  });

  it('빈 값과 공백뿐인 값은 없는 것으로 본다', () => {
    expect(errorOf({ ...VALID_ENV, INTERNAL_API_KEY: '' })).toContain(
      'INTERNAL_API_KEY is required',
    );
    expect(errorOf({ ...VALID_ENV, INTERNAL_API_KEY: '   ' })).toContain(
      'INTERNAL_API_KEY is required',
    );
  });

  it('필수 값의 형식을 검사한다', () => {
    const message = errorOf({
      ...VALID_ENV,
      MONGODB_URI: 'postgres://db',
      JWT_SECRET: 'not base64!',
      USER_SERVICE_URL: 'ftp://users.example.com',
    });
    expect(message).toContain('MONGODB_URI must start with mongodb://');
    expect(message).toContain('JWT_SECRET must be base64');
    expect(message).toContain('USER_SERVICE_URL must be an http(s) URL');
  });

  it('mongodb://와 URL-safe base64를 받는다', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/db',
        JWT_SECRET: 'ab-c_d',
      }),
    ).not.toThrow();
  });

  it('비어 있는 선택 값은 검사하지 않는다', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        NODE_ENV: '',
        PORT: '',
        CORS_ORIGINS: '',
        SEARCH_SERVICE_URL: '',
      }),
    ).not.toThrow();
  });

  it('선택 값이 있으면 형식을 검사한다', () => {
    const message = errorOf({
      ...VALID_ENV,
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

  it('PORT가 정수가 아니면 거부한다', () => {
    expect(errorOf({ ...VALID_ENV, PORT: '3001.5' })).toContain(
      'PORT must be an integer',
    );
  });

  it('CORS 출처마다 앞뒤 공백을 지운다', () => {
    const result = validateEnv({
      ...VALID_ENV,
      CORS_ORIGINS: ' https://a.example.com , http://localhost:3000 ',
    });
    expect(result.CORS_ORIGINS).toBe(
      'https://a.example.com,http://localhost:3000',
    );
  });

  it('오류 메시지에 값을 넣지 않는다', () => {
    const message = errorOf({
      MONGODB_URI: 'leaky-mongo-password',
      JWT_SECRET: 'leaky jwt secret!',
      USER_SERVICE_URL: 'leaky-user-url',
      INTERNAL_API_KEY: 'k',
    });
    expect(message).not.toMatch(/leaky/);
  });
});
