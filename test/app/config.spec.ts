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

const ENV_KEYS = [
  'JWT_SECRET',
  'MONGODB_URI',
  'USER_SERVICE_URL',
  'INTERNAL_API_KEY',
  'SEARCH_SERVICE_URL',
];
const JWT_SECRET_RAW = 'config-spec-secret';

const ENV_LINES = [
  `JWT_SECRET=${Buffer.from(JWT_SECRET_RAW).toString('base64')}`,
  'MONGODB_URI=mongodb://127.0.0.1:1/config-spec',
  'USER_SERVICE_URL=http://127.0.0.1:9',
  'INTERNAL_API_KEY=config-spec',
  'SEARCH_SERVICE_URL=http://127.0.0.1:9',
];

type FreshModules = {
  AppModule: typeof import('src/app.module').AppModule;
  Test: typeof import('@nestjs/testing').Test;
  withFakeMongoose: typeof import('../helpers/fake-mongoose').withFakeMongoose;
  ConfigService: typeof import('@nestjs/config').ConfigService;
  JwtService: typeof import('@nestjs/jwt').JwtService;
};

/** 모듈 레지스트리를 새로 만들어 `ConfigModule.forRoot()`가 현재 cwd 기준으로 다시 평가되게 한다. */
const loadFreshModules = (): FreshModules => {
  let freshModules: FreshModules;
  jest.isolateModules(() => {
    freshModules = {
      AppModule: require('src/app.module').AppModule,
      Test: require('@nestjs/testing').Test,
      withFakeMongoose: require('../helpers/fake-mongoose').withFakeMongoose,
      ConfigService: require('@nestjs/config').ConfigService,
      JwtService: require('@nestjs/jwt').JwtService,
    };
  });
  return freshModules!;
};

const compileAppModule = (fresh: FreshModules) =>
  fresh
    .withFakeMongoose(fresh.Test.createTestingModule({ imports: [fresh.AppModule] }))
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
  moduleRef: Awaited<ReturnType<typeof compileAppModule>>,
  fresh: FreshModules,
  secret: string,
) => {
  const jwt = moduleRef.get(fresh.JwtService, { strict: false });
  const token = jwt.sign({ sub: 'a@b.c' });
  expect(jwt.verify(token, { secret: Buffer.from(secret) }).sub).toBe('a@b.c');
};

describe('ConfigModule .env 로딩', () => {
  const originalCwd = process.cwd();
  const saved: Record<string, string | undefined> = {};
  let dir: string;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-spec-'));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('.env를 ConfigService로 읽고 JWT_SECRET을 JwtModule에 넘긴다', async () => {
    fs.writeFileSync(path.join(dir, '.env'), ENV_LINES.join('\n'));
    const fresh = loadFreshModules();
    const moduleRef = await compileAppModule(fresh);

    const configService = moduleRef.get(fresh.ConfigService);
    expect(configService.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, fresh, JWT_SECRET_RAW);

    await moduleRef.close();
  });

  it('.env 없이 process.env 값만으로도 기동한다(배포)', async () => {
    expect(fs.existsSync(path.join(dir, '.env'))).toBe(false);
    setProcessEnv(ENV_LINES);
    const fresh = loadFreshModules();
    const moduleRef = await compileAppModule(fresh);

    const configService = moduleRef.get(fresh.ConfigService);
    expect(configService.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, fresh, JWT_SECRET_RAW);

    await moduleRef.close();
  });

  it('같은 키면 .env보다 process.env가 우선한다', async () => {
    fs.writeFileSync(
      path.join(dir, '.env'),
      [
        `JWT_SECRET=${Buffer.from('from-dotenv-file').toString('base64')}`,
        'MONGODB_URI=mongodb://127.0.0.1:1/from-dotenv-file',
      ].join('\n'),
    );
    setProcessEnv(ENV_LINES);
    const fresh = loadFreshModules();
    const moduleRef = await compileAppModule(fresh);

    const configService = moduleRef.get(fresh.ConfigService);
    expect(configService.get('MONGODB_URI')).toBe('mongodb://127.0.0.1:1/config-spec');
    expectJwtSecret(moduleRef, fresh, JWT_SECRET_RAW);

    await moduleRef.close();
  });

  it('JWT_SECRET이 없으면 기동에 실패한다', async () => {
    fs.writeFileSync(
      path.join(dir, '.env'),
      ENV_LINES.filter((line) => !line.startsWith('JWT_SECRET=')).join('\n'),
    );
    const fresh = loadFreshModules();
    await expect(compileAppModule(fresh)).rejects.toThrow(/JWT_SECRET/);
  });
});
