/**
 * 환경 변수 로딩 테스트
 *
 * `dotenv.config()` 호출 없이 `ConfigModule.forRoot()`가 작업 디렉터리의 `.env`를 읽어
 * 데코레이터 단계가 아닌 팩토리(`MongooseModule.forRootAsync`, `JwtModule.registerAsync`)에
 * 값을 넘기는지 검증합니다. 실제 `.env`를 읽지 않도록 임시 디렉터리로 `chdir`합니다.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const KEYS = [
  'JWT_SECRET',
  'MONGODB_URI',
  'USER_SERVICE_URL',
  'INTERNAL_API_KEY',
  'SEARCH_SERVICE_URL',
];
const SECRET = 'config-spec-secret';

const ENV_LINES = [
  `JWT_SECRET=${Buffer.from(SECRET).toString('base64')}`,
  'MONGODB_URI=mongodb://127.0.0.1:1/config-spec',
  'USER_SERVICE_URL=http://127.0.0.1:9',
  'INTERNAL_API_KEY=config-spec',
  'SEARCH_SERVICE_URL=http://127.0.0.1:9',
];

type Loaded = {
  AppModule: typeof import('src/app.module').AppModule;
  Test: typeof import('@nestjs/testing').Test;
  withFakeMongoose: typeof import('../helpers/fake-mongoose').withFakeMongoose;
  ConfigService: typeof import('@nestjs/config').ConfigService;
  JwtService: typeof import('@nestjs/jwt').JwtService;
};

/** 모듈 레지스트리를 새로 만들어 `ConfigModule.forRoot()`가 현재 cwd 기준으로 다시 평가되게 한다. */
const loadFresh = (): Loaded => {
  let loaded: Loaded;
  jest.isolateModules(() => {
    loaded = {
      AppModule: require('src/app.module').AppModule,
      Test: require('@nestjs/testing').Test,
      withFakeMongoose: require('../helpers/fake-mongoose').withFakeMongoose,
      ConfigService: require('@nestjs/config').ConfigService,
      JwtService: require('@nestjs/jwt').JwtService,
    };
  });
  return loaded!;
};

const compile = (m: Loaded) =>
  m
    .withFakeMongoose(m.Test.createTestingModule({ imports: [m.AppModule] }))
    .compile();

/** 배포 플랫폼(클라우드타입)처럼 `.env` 대신 프로세스 환경 변수로 넣는다. */
const setProcessEnv = (lines: string[]) => {
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    process.env[key] = rest.join('=');
  }
};

/** `JwtModule`이 `secret`으로 서명하는지 확인한다. */
const expectJwtSecret = (
  moduleRef: Awaited<ReturnType<typeof compile>>,
  m: Loaded,
  secret: string,
) => {
  const jwt = moduleRef.get(m.JwtService, { strict: false });
  const token = jwt.sign({ sub: 'a@b.c' });
  expect(jwt.verify(token, { secret: Buffer.from(secret) }).sub).toBe('a@b.c');
};

describe('ConfigModule .env loading', () => {
  const originalCwd = process.cwd();
  const saved: Record<string, string | undefined> = {};
  let dir: string;

  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-spec-'));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('reads .env into ConfigService and passes JWT_SECRET to JwtModule', async () => {
    fs.writeFileSync(path.join(dir, '.env'), ENV_LINES.join('\n'));
    const m = loadFresh();
    const moduleRef = await compile(m);

    const config = moduleRef.get(m.ConfigService);
    expect(config.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, m, SECRET);

    await moduleRef.close();
  });

  it('works without .env when values come from process.env (deploy)', async () => {
    expect(fs.existsSync(path.join(dir, '.env'))).toBe(false);
    setProcessEnv(ENV_LINES);
    const m = loadFresh();
    const moduleRef = await compile(m);

    const config = moduleRef.get(m.ConfigService);
    expect(config.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, m, SECRET);

    await moduleRef.close();
  });

  it('prefers process.env over .env when both define a key', async () => {
    fs.writeFileSync(
      path.join(dir, '.env'),
      [
        `JWT_SECRET=${Buffer.from('from-dotenv-file').toString('base64')}`,
        'MONGODB_URI=mongodb://127.0.0.1:1/from-dotenv-file',
      ].join('\n'),
    );
    setProcessEnv(ENV_LINES);
    const m = loadFresh();
    const moduleRef = await compile(m);

    const config = moduleRef.get(m.ConfigService);
    expect(config.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, m, SECRET);

    await moduleRef.close();
  });

  it('fails at bootstrap when JWT_SECRET is missing', async () => {
    fs.writeFileSync(
      path.join(dir, '.env'),
      ENV_LINES.filter((line) => !line.startsWith('JWT_SECRET=')).join('\n'),
    );
    const m = loadFresh();
    await expect(compile(m)).rejects.toThrow(/JWT_SECRET/);
  });
});
