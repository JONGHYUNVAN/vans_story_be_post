# 결정 기록

날짜순. 각 항목은 "무엇을 / 왜 / 대안" 세 줄. 결정을 뒤집으면 새 항목을 추가하고 옛 항목에 링크한다.
보류 중인 결정은 `TODO.md` 2절에 있다.

## 2026-10-22

### CLAUDE.md 초안에 TODO 2절 추천안을 반영 (초안 검토 시 확정)

아래 네 건은 `TODO.md` 2절의 추천안을 그대로 채택한 **초안**이다. 검토에서 바뀌면 이 항목을 고친다.

1. **import 경로는 `src/...` 절대경로** — tsconfig `paths`와 jest `moduleNameMapper`가 이미 지원하고, Nest CLI가 빌드 시 경로를 재작성한다. 대소문자가 섞인 폴더에서 `../../../` 체인보다 읽기 쉽다. 기존 상대경로는 손대는 파일에서만 바꾼다. 대안: Nest 스캐폴딩 기본인 상대경로.
2. **줄바꿈은 LF** — `.editorconfig`와 `.prettierrc`(`endOfLine: lf`)로 선언. `.gitattributes`에 `*.ts text eol=lf` 추가와 `git add --renormalize .`는 전체 파일이 바뀌는 커밋이라 별도 커밋으로 미룬다. 대안: `endOfLine: auto`(문제를 덮는다).
3. **환경 변수는 당분간 `process.env` 직접 읽기** — 단, 모듈 최상단이 아닌 생성자·팩토리·함수 안에서 읽고 필수값 누락 시 기동 실패. `@nestjs/config` + 스키마 검증은 문서 작업 범위를 넘어 별도 작업(`TODO.md` 3절). → 같은 날 아래 "`@nestjs/config` 도입"으로 대체.
4. **명명은 새 파일만 Nest 표준** (`<feature>.<layer>.ts`, 소문자 폴더). 기존 post 모듈·utils의 PascalCase 폴더는 `forceConsistentCasingInFileNames: true` 복구와 함께 별도 작업으로 전환. Windows에서 대소문자만 바꾸는 리네임은 `git mv` 두 단계가 필요하다.

### CommonJS 출력 유지

- 무엇: tsconfig는 `module: nodenext`지만 `package.json`에 `"type": "module"`을 두지 않아 CJS로 출력한다. ESM 전환하지 않는다.
- 왜: jest(ts-jest) + `--experimental-vm-modules` 조합, `__dirname`을 쓰는 `SwaggerAuthMiddleware`, CJS import 순서에 기대는 `test/app/env.ts`가 모두 CJS 전제. 전환 이득(top-level await 등)이 없다.
- 대안: ESM 전환 — jest 설정, `__dirname` 대체, dotenv 로드 순서를 모두 다시 잡아야 한다.

### TypeScript `~6.0.x` 고정

- 무엇: `typescript: ~6.0.3`. 7.x로 올리지 않는다.
- 왜: 6.0은 5.x 호환 마지막 계열이고 `emitDecoratorMetadata`/`experimentalDecorators` 조합이 Nest 12와 검증됐다. 7.x(Go 포팅)는 플러그인·transform 호환이 다르다.
- 대안: 7.x 선행 도입 — Nest CLI·ts-jest가 공식 지원한 뒤 재검토.

### Node 26 `engines` 유지, 로컬·Docker는 더 낮은 버전으로 실행

- 무엇: `engines.node >= 26.0.0`은 그대로 둔다. Dockerfile은 `node:24-alpine`(24.x 최신, `require(esm)` 지원).
- 왜: `@types/node ^26`에 맞춘 선언이다. `npm test`는 Node 24.9 이상이 필요하다 — NestJS 12 패키지가 ESM이라 jest가 `require(esm)`로 읽는데, Node 23에서는 모든 스위트가 "Must use import to load ES Module"로 실패한다(2026-10-22 확인). `npx tsc --noEmit`은 23에서도 통과한다. 로컬 nvm에는 18/22/23만 있어 테스트를 돌리려면 `nvm install 26`이 먼저다. 배포 환경 확인은 `TODO.md` 3절 자동화 항목.
- 대안: `engines`를 24로 내리기 — 타입 선언과 어긋난다.

### 비밀값 로그 제거, Swagger 비밀번호 미설정 시 인증 거부

- 무엇: `main.ts`의 `MongoDB URI` 로그 삭제. `SwaggerAuthMiddleware`가 입력·기대 비밀번호를 찍던 `console.log` 삭제, `SWAGGER_ADMIN_PASSWORD`가 비어 있으면 인증 실패 처리. `search-index.client.ts`의 하드코딩 키를 `INTERNAL_API_KEY`로 교체.
- 왜: 운영 접속 문자열과 비밀번호가 로그 수집기에 남았다. 기존 코드는 `undefined === undefined`로 비밀번호 미설정 시 누구나 Swagger에 들어올 수 있었다. Django 검색 서비스가 `settings.INTERNAL_API_KEY`로 같은 키를 검증하므로 환경 변수 하나로 통일 가능.
- 대안: 검색 서비스용 키를 별도 변수로 분리 — 현재 두 서비스가 같은 값을 쓰므로 불필요.

### `docs/` 추적 범위

- 무엇: `.gitignore`의 `/docs`를 `/docs/typedoc`으로 좁히고 typedoc 출력을 `docs/typedoc/`으로 옮겼다. `docs/*.md`와 `docs/swagger/`는 추적한다.
- 왜: `docs/architecture.md`, `docs/decisions.md`를 커밋해야 하는데 `/docs` 전체가 무시되고 있었다. `docs/swagger/clean.html`을 untrack할지는 외부(GitHub Pages 등) 사용 여부 확인 뒤 결정(`TODO.md` 1-2절).

### 미사용 의존성 제거, TypeORM도 미리 두지 않음

- 무엇: `typeorm`, `@nestjs/typeorm`, `sqlite3`, `swagger-ui-express`, `@types/swagger-ui-express`, `express-basic-auth`, `@nestia/sdk`(+ tsconfig `plugins`), `@types/mongodb`, `source-map-support` 제거와 `db.sqlite` 삭제. `class-validator`·`class-transformer`·`dotenv`는 dependencies로, `@types/express-session`은 devDependencies로 옮겼다(설치 버전 유지. 정정: 당시 "16.6은 `config()`가 안내 로그를 찍는다"고 적었으나 로그는 16.6.0과 17.x 이상만 찍고 16.6.1은 `quiet` 기본값이 true다). `ts-node`·`tsconfig-paths`는 VS Code 디버그 설정이 쓰므로 남겼다.
- 왜: knip·depcheck 결과와 `npm ls`·설정 파일 수동 확인이 일치했다. 쓰지 않는 패키지는 Dependabot 경고와 네이티브 빌드(`sqlite3` node-gyp)만 늘린다. MariaDB 도입 계획이 있지만 TypeORM이 필요하면 그때 최신 버전으로 `@nestjs/typeorm typeorm mysql2`를 추가하면 되고, `sqlite3`는 MariaDB와 무관하다.
- 대안: TypeORM을 MariaDB 도입까지 유지 — 설치 한 줄로 복구되는 것을 미리 둘 이유가 없다. ORM 선택(TypeORM/Prisma/MikroORM 등)도 도입 시점에 정한다.

### `@nestjs/config` 도입

- 무엇: `@nestjs/config` 12.0.1 추가. `AppModule`에 `ConfigModule.forRoot({ isGlobal: true })`, `MongooseModule.forRoot(process.env…)` → `forRootAsync` + `ConfigService.getOrThrow('MONGODB_URI')`, `JwtModule.register` → `registerAsync` + `getOrThrow('JWT_SECRET')`. `main.ts`는 `app.get(ConfigService)`로 읽는다. `dotenv.config()` 호출(`main.ts`, `app.module.ts`) 제거. 스키마 검증과 나머지 `process.env` 읽기 전환은 후속(`TODO.md` 3절).
- 왜: Nest 표준 방식. 데코레이터 인자에서 `process.env`를 읽으면 `.env` 로드 순서에 기대게 된다 — 실제로 `AuthModule`의 `JwtModule.register`는 `app.module.ts`의 `dotenv.config()`보다 먼저 평가돼 `main.ts`의 호출에만 의존하고 있었다. 팩토리로 옮기면 순서와 무관하고, 필수값 누락이 `Configuration key "…" does not exist`로 기동 시 드러난다. `forRoot`는 schema 없이 쓰면 `.env`를 동기로 읽어 `process.env`에 덮어쓰지 않고 채우므로(기존 `dotenv.config()`와 같음) 아직 `process.env`를 직접 읽는 코드도 그대로 동작한다. 내부적으로 `dotenv.parse`만 써서 안내 로그도 없다.
- 대안: `import 'dotenv/config'`를 `main.ts` 첫 줄에 두고 나머지 `config()` 삭제 — 가장 작은 수정이지만 데코레이터 평가 순서 의존이 남고, 테스트처럼 `main.ts`를 거치지 않는 경로는 따로 챙겨야 한다.
- 함께 고침: 이 작업을 검증하다가 `bootstrap.spec.ts`의 `overrideModule(MongooseModule)`이 무효이고 테스트가 운영 Atlas에 연결해 왔음을 발견. `withFakeMongoose`로 교체(CLAUDE.md 함정 8).
