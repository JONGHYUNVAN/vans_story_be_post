# TODO

이 저장소의 문서 정비 계획, 결정 대기 항목, 기술 부채 목록이다.
작업 규칙은 `CLAUDE.md`, 결정 근거는 `docs/decisions.md`에 둔다.
끝낸 항목은 체크하고, 더 이상 유효하지 않은 항목은 지운다.

최종 갱신: 2026-10-22 (조사 기준 커밋: `65a3855`, Node 26 / NestJS 12 / TypeScript 6.0 업그레이드 병합 직후. 1-1절·1-2절 신규 파일과 보안 최우선 항목 처리)
추가 갱신: 2026-10-22 PR #2 병합 후 NestJS·TypeScript 표준 전수조사(기준 커밋 `5134a0b`) 반영 — 2절 결정 5~14, 3절 "표준 준수" 묶음. 근거·`file:line`·판정은 `docs/audits/2026-10-22-nest-standards.md`(번호 `#N`은 그 문서 1절 표의 행 번호)

---

## 1. 문서 정비 계획

원칙: 정보 종류마다 집은 하나, 독자(에이전트 / 사람)별로 나눈다.
Claude Code 공식 가이드 기준으로 CLAUDE.md는 200줄 미만, "이 줄을 지우면 Claude가 실수하는가"로 포함 여부를 판단한다.

### 1-1. 에이전트용 (Claude Code)

- [x] `CLAUDE.md` — 작업 규칙. 200줄 미만.
  - 포함: 한 문단 개요, 명령(실행 금지 명령 표 포함), 요청 흐름과 레이어 책임, 명명 규칙(목표 규칙 + 예외는 2~3줄), 코딩 규칙(환경 변수·로깅·에러 처리·`any`·JSDoc·전역 예외 필터·설정 검증·페이지네이션 유틸), 테스트 규칙, 보안·비밀, 함정 1~5(가드 DI 범위, ESM 전환 금지, TS 6.0 고정, Node 26, `NODE_OPTIONS` POSIX 문법), 변경 체크리스트
  - 제외: 코드에서 유추되는 것, 파일별 설명, 자주 바뀌는 수치, 기술 부채(→ 이 파일 3절)
- [x] `.claude/settings.json` — 권한 deny 규칙(`Read(./.env)`, `npm run start*`, `test:e2e*`, `test:all*`, `node dist/main*`). CLAUDE.md는 조언일 뿐이라 강제 차단은 여기서 한다.
- [x] `.claude/rules/dto.md` — `paths: src/**/dto/**, src/**/DTO/**`
- [x] `.claude/rules/schemas.md` — `paths: src/**/schemas/**`
- [x] `.claude/rules/testing.md` — `paths: test/**`
- [x] `.claude/skills/add-endpoint/SKILL.md`
- [x] `.gitignore`에 `CLAUDE.local.md`, `.claude/settings.local.json` 추가
- [ ] 작성 후 `/doctor prompt-audit`로 CLAUDE.md와 rules 감사(코드에서 유추 가능한 줄, 모순되는 줄 제거) — 대화형 `claude` 터미널에서 실행

### 1-2. 사람용

- [x] `.env.example` — 변수 이름만, 값 없음. `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, `SWAGGER_ADMIN_PASSWORD`, `SEARCH_SERVICE_URL`, `USER_SERVICE_URL`, `INTERNAL_API_KEY`, `NODE_ENV`, `PORT`(2026-10-22부터 `main.ts`가 읽음)
- [x] `.editorconfig` — `end_of_line = lf`, 2칸 들여쓰기, utf-8, 파일 끝 개행. `.prettierrc`에 `endOfLine: lf`도 추가. `.gitattributes` + `git add --renormalize .`는 별도 커밋(2절 결정 2)
- [ ] `README.md` 축소 — "무엇·실행·어디를 볼지"만 남긴다.
  - 버전표를 Node 26 / NestJS 12 / TypeScript 6.0 / mongoose 7로 갱신
  - 환경 변수 절은 `.env.example` 링크로 대체(현재 4개만 적혀 있고 `PORT` 기본값 3000은 실제 코드 3001과 다름)
  - 요청 흐름·인증 구조·데이터 모델 절은 `docs/architecture.md`로 이동
- [x] `docs/architecture.md` — 요청 흐름, 모듈 구성, 인증, 외부 서비스, 데이터 모델, 엔드포인트 표, 적용된 보안 조치. README·SECURITY.md 축소 시 중복 절을 이쪽 링크로 대체
- [x] `docs/decisions.md` — 2절 추천안 채택(초안), CJS 유지, TS 6.0 고정, Node 26 engines, 비밀값 로그 제거, `docs/` 추적 범위
- [ ] `SECURITY.md` 축소 — GitHub 커뮤니티 파일 규격대로 "취약점 신고 방법" + 실제 적용된 보호 조치 목록만(30줄 안팎). 현재 394줄 중 빈 템플릿 항목(긴급 연락처 등) 삭제, 아키텍처 설명은 `docs/architecture.md`로
- [ ] `api.md` 삭제 — 501줄 수기 문서라 Swagger와 드리프트. `swagger-spec.json` → `docs/swagger/clean.html` 생성물로 단일화
- [ ] `CATEGORY_MIGRATION.md` → `docs/history/category-migration.md`로 이동(기록 가치가 있으니 삭제하지 않음)
- [ ] 생성물 정리 — `docs/swagger/README.md`, `docs/swagger/clean.html`, `swagger-spec.json`이 강제 추가돼 있다. 생성물은 untrack하고 생성 명령만 CLAUDE.md에 적는다. ~~0바이트 `db.sqlite` 삭제~~ (2026-10-22 완료, 의존성 정리와 함께)
  (2026-10-22: `.gitignore`를 `/docs` → `/docs/typedoc`으로 좁히고 typedoc `out`을 `docs/typedoc`으로 옮겨 `docs/*.md`를 커밋할 수 있게 했다. swagger 생성물은 아직 추적 중)
  **확인 필요**: Swagger HTML을 GitHub Pages 등 외부에서 쓰고 있으면 untrack하지 않는다.
  (전수조사 #8: `swagger-spec.json`을 만드는 코드가 없어 낡았다 — 카테고리 API가 없고 스키마 이름이 옛 `CreateDto/ResponseDto`. `swagger:html`(옛 `swagger:build:clean`)은 이 낡은 JSON으로 HTML을 만든다. untrack하든 유지하든 앱에서 문서를 생성하는 스크립트가 먼저)

### 1-3. 만들지 않기로 한 것

- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` — 1인 프로젝트. 커밋 규칙과 체크리스트는 CLAUDE.md가 대신한다
- `AGENTS.md` — 다른 코딩 에이전트를 도입하기 전까지 불필요. 도입 시 CLAUDE.md에서 `@AGENTS.md`로 import하는 방식
- `CHANGELOG.md` — README 버전표와 git log로 대체(nestjs/nest 핵심 저장소도 루트 CHANGELOG 없이 릴리스 노트 사용)
- commitlint / husky — Claude가 커밋 메시지를 쓰는 동안은 CLAUDE.md 규칙으로 충분. 보류

### 1-4. 작업 순서

1. ~~에이전트용 파일(1-1) 먼저 작성~~ (2026-10-22 완료) → `/doctor prompt-audit` 남음
2. ~~신규 사람용 파일(`.env.example`, `.editorconfig`, `docs/decisions.md`, `docs/architecture.md`)~~ (2026-10-22 완료)
3. 기존 문서 축소·삭제·이동(README, SECURITY, api.md, CATEGORY_MIGRATION, 생성물) — 초안 확인 후 진행

---

## 2. 결정 대기 항목

CLAUDE.md 초안에 추천안을 반영했다(2026-10-22, `docs/decisions.md`에 초안으로 기록). 초안 검토 때 확정하고 `docs/decisions.md`의 "초안" 표기를 지운다.

| # | 항목 | 현재 상태 | 추천안 | 대안 |
|---|---|---|---|---|
| 1 | import 경로 | 상대경로와 `src/...` 절대경로가 같은 파일 안에서도 혼재 | `src/...` 절대경로로 통일. 근거: tsconfig `paths`와 jest `moduleNameMapper`가 이미 지원, Nest CLI가 빌드 시 경로를 재작성, 파일 이동 시 수정 범위가 작음, 대소문자 혼재 폴더에서 `../` 체인보다 읽기 쉬움 | 상대경로(Nest 기본 스캐폴딩 방식) |
| 2 | 줄바꿈 | `.gitattributes`는 `* text=auto`뿐. Windows autocrlf 체크아웃이라 `npm run lint`가 prettier `Delete ␍` 오류를 수천 건 냄 | `.editorconfig` `end_of_line = lf` + `.gitattributes`에 `*.ts text eol=lf` 등 추가 + `.prettierrc`에 `"endOfLine": "lf"` 명시. 적용 후 `git add --renormalize .` | `.prettierrc`에 `"endOfLine": "auto"`(빠르지만 문제를 덮음) |
| 3 | 환경 변수 접근 | **2026-10-22 `@nestjs/config` 도입으로 장기안 착수(3절 설정·구조).** 이하는 도입 전 상태: `@nestjs/config` 없음. `dotenv.config()`가 `main.ts`, `app.module.ts`, `config/database.ts` 3곳에서 호출, `process.env` 직접 읽기 9개 파일 | 단기: 새 코드는 `process.env`를 모듈 최상단이 아닌 생성자·팩토리 안에서 읽고, 필수값 누락 시 기동 실패시킨다. 장기: `@nestjs/config` + 스키마 검증 도입(3절, 함정 2의 dotenv 호이스팅 문제도 함께 해소) | 지금 바로 `@nestjs/config` 도입(문서 작업 범위를 넘음) |
| 4 | 명명 전환 시점 | post 모듈: PascalCase 폴더 + 일반 명사 파일명(`Controller/controller.ts`). category 모듈: Nest 표준(`controller/category.controller.ts`). utils: 혼재. (전수조사 정정: category의 레이어 폴더 `controller/`·`service/`·`module/`도 CLI 출력과 다르다. CLI는 기능 폴더에 평평하게 둔다 — 목표 구조는 결정 6) | 새 코드는 Nest 표준(소문자 폴더, `<feature>.<layer>.ts`). 기존 파일 전환은 별도 작업으로, `forceConsistentCasingInFileNames: true` 복구와 함께 진행. Windows에서 대소문자만 바꾸는 리네임은 `git mv` 두 단계 필요 | 문서 작업과 동시에 전환(리뷰 범위가 커짐) |
| 5 | 응답 직렬화·날짜·id 필드 (#9, #29, #35) | 커스텀 `@ResponseField` + `mapToDto`, 날짜는 서버 locale에 따르는 `toLocaleString()`, 게시글은 `_id`·카테고리는 `id`, populate 객체가 `mainCategoryId`로 나감 | class-transformer `@Expose()` + `plainToInstance(..., { excludeExtraneousValues: true })`, ISO 날짜, 카테고리 참조는 `{ id, value, label }` | `mapToDto` 유지 + 날짜만 ISO / 현행 유지 + 운영 `TZ`·`LANG` 고정. **프런트 계약 변경** — 운영 컨테이너 locale부터 확인 |
| 6 | 폴더 구조 목표 (#31) | **확정 2026-10-22** — `docs/conventions.md` 1절: CLI 출력 그대로 `src/posts/posts.controller.ts`(`modules/` 래퍼 없음), `src/auth/`, `src/common/`, 외부 연동은 `src/user-service/`·`src/search-index/` 모듈. 근거 `docs/decisions.md` "코드 컨벤션" | — | — |
| 7 | 라우트 prefix·버전 (#23) | `@Controller('api/v1/posts')` 하드코딩, 태그 이름 `'api/v1/posts'` | `setGlobalPrefix('api')` + URI versioning, 외부 URL 유지, `@ApiTags('posts')` | 현행 유지. Swagger 경로 `api/posts/swagger`와 게이트웨이 규칙 확인 필요 |
| 8 | `JwtModule` 존치 (#13) | 가드가 쓰지 않는 `JwtService`를 주입 → 모듈마다 `AuthModule` import(CLAUDE.md 함정 1). 이 서비스는 서명하지 않음 | 주입 제거 + `JwtModule` 제거. RS256/JWKS 전환(3절 보안)과 함께면 더 자연스럽다 | 주입만 제거, `JwtModule` 유지. `test/app/config.spec.ts`의 `JwtService.sign` 검사가 바뀐다 |
| 9 | 전역 `ValidationPipe` 위치 (#20) | **확정 2026-10-22** — `APP_PIPE`(`docs/conventions.md` 3절) | — | — |
| 10 | Swagger 인증 미들웨어 형태 (#22) | **확정 2026-10-22** — 함수형 미들웨어 + `app.use`(`docs/conventions.md` 4절 미들웨어) | — | — |
| 11 | 단위 테스트 위치 (#28) | **확정 2026-10-22** — 대상 옆 colocate, e2e는 `test/*.e2e-spec.ts`(`docs/conventions.md` 1·7절) | — | — |
| 12 | Nest 12 기준선 툴체인 (#34) | jest, eslint 8, `strict: false` | 지금은 전환하지 않음(eslint는 아래 flat config 항목대로, `strict`는 `any` 축소 후) | vitest·oxlint 전환 — 기준선은 ESM 전제라 CJS 유지 결정과 일부 충돌 |
| 13 | 미사용 조회 메서드 (#16) | `findByAuthor`·`searchPosts`·`findByThemeAndCategory`가 컨트롤러에 없음 | 삭제(검색은 Django 서비스 담당) | 엔드포인트로 노출. 그 경우 `searchPosts`의 `$regex` 입력 이스케이프 필수 |
| 14 | `SESSION_SECRET` 도입 (#10) | 세션 secret이 `JWT_SECRET` 재사용 | 새 필수 변수(`validateEnv`·`.env.example`·클라우드타입) | 현행 유지 |

---

## 3. 기술 부채

우선순위 순. CLAUDE.md의 "함정" 절에는 작업 규칙만 넣고, 고쳐야 할 것은 여기에 둔다.

### 보안

- [x] **`RolesGuard`가 어디에도 등록되어 있지 않다.** `@Roles('admin')`이 붙은 게시글 생성·삭제도 인증만 통과하면 누구나 호출할 수 있다. 게다가 Spring이 발급하는 `auth` 클레임은 `ROLE_ADMIN` 형식이라 `RolesGuard`를 그냥 켜면 관리자도 막힌다. 해결 순서: (1) Spring `JwtProvider`의 `auth` 클레임 형식 확인(쉼표 구분 문자열인지) → (2) `JwtStrategy.validate`에서 `ROLE_ADMIN` → `admin`으로 정규화 또는 `@Roles('ROLE_ADMIN')` → (3) `@UseGuards(JwtAuthGuard, RolesGuard)` 또는 `APP_GUARD` 등록 → (4) `PostsService.update`의 `userRole !== 'admin'` 비교도 같이 맞춤. **최우선** (2026-10-22 `fix/authorization`: `auth`는 `ROLE_ADMIN`/`ADMIN` 쉼표 구분으로 확인 → `JwtStrategy`가 `Role`로 정규화, `@UseGuards(JwtAuthGuard, RolesGuard)`. 프런트에서 일반 사용자에게 생성·삭제 버튼이 보이는지는 미확인)
  - [x] (전수조사 #2) 카테고리 생성·수정·삭제·활성화·비활성화 5개 엔드포인트는 `@Roles`조차 없다(Swagger 설명은 "관리자 권한 필요"). 로그인한 아무 사용자나 카테고리를 바꿀 수 있다 — 같이 처리
  - [x] (전수조사 #3) `PostsService.update`는 `userEmail && userRole && …`이라 role이 없으면 권한 검사를 통과한다(fail-open). 파라미터를 필수로, role 없으면 거부. 이 동작을 고정한 `service.spec.ts`의 "backward compatibility" 테스트를 거부 케이스로 교체
- [ ] **refresh 토큰이 access 토큰으로 통과한다.** Spring `JwtProvider`가 access(5시간)와 refresh(7일)를 같은 키·같은 클레임(`sub`, `auth`, `exp`)으로 만들고 만료만 다르게 줬다. 그래서 7일짜리 refresh 토큰을 `Authorization: Bearer`에 넣어도 `JwtStrategy`가 받아준다. Spring `fix/token-type` 브랜치(`D:\blog\vans_story_be`)가 두 토큰에 `typ` 클레임(`access`/`refresh`)을 넣고 Spring 필터·refresh 엔드포인트에서 구분한다(전환 정책은 그 레포 `SECURITY.md` "토큰 타입(typ) 클레임"). 이 서비스 할 일: `JwtPayload`에 `typ?: string`을 더하고 `JwtStrategy.validate`(`src/auth/jwt.strategy.ts`)에서 `payload.typ !== 'access'`면 거부(`null` 반환 → 401). 테스트는 `typ: 'access'` 통과, `typ: 'refresh'` 거부, `typ` 없음 거부. **순서 제약**: Spring 배포 **후**에만 바꾼다 — 먼저 바꾸면 Spring이 아직 `typ` 없는 토큰을 발급하므로 모든 인증 요청이 401. Spring 배포 직후에도 그 전에 발급된 access 토큰(`typ` 없음, 최대 5시간)이 남아 있으므로, 배포 + 5시간 뒤에 바꾸면 기존 로그인 사용자도 401을 보지 않는다(일찍 바꾸면 프런트의 401 → refresh 재시도로 복구되거나, 실패하면 재로그인)
- [x] (전수조사 #4) 목록 `limit` 상한이 없다. `?limit=100000`이면 게시글 10만 건 + 사용자 서비스 호출 10만 번. `?page=abc`는 `NaN`으로 통과. 페이지네이션 Query DTO(`@IsInt @Min(1) @Max(50)`) — `FindPostsQueryDto`로 처리(묶음 A)
- [ ] (전수조사 #10) 세션: secret이 `JWT_SECRET` 재사용(도달 불가한 `'fallback-secret'` 포함), `secure` 쿠키인데 `trust proxy` 미설정(프록시 뒤에서 Swagger 로그인 유지 실패 가능), 운영 MemoryStore, Swagger 비밀번호 `===` 비교 → `SESSION_SECRET`(2절 결정 14), `app.set('trust proxy', 1)`, `crypto.timingSafeEqual`
- [ ] (전수조사 #11) `UserServiceClient.getNicknameByEmail`이 이메일을 URL 경로에 그대로 넣는다 → `encodeURIComponent`
- [ ] JWT 서명을 HS512 공유 비밀키에서 RS256/ES256 + JWKS로. 대칭키는 검증하는 쪽이 토큰을 만들 수도 있어, 이 서비스에서 `JWT_SECRET`이 새면 모든 서비스에서 통하는 관리자 토큰을 만들 수 있다. Kotlin 사용자 서버가 개인키로 서명하고 `/.well-known/jwks.json` 공개 → 이 서비스는 `jwks-rsa`의 `secretOrKeyProvider`로 공개키 검증만(비밀값 제거). **레포를 넘는 작업**(사용자 서버 먼저). 만료 전 폐기(로그아웃·차단)가 필요하면 짧은 만료 + 리프레시 또는 민감 엔드포인트만 introspection(RFC 7662)을 따로 결정. 배경: `docs/architecture.md` "인증·권한"
- [x] `src/main.ts:82` — MongoDB URI 로그 제거 (2026-10-22)
- [x] `src/swagger/middleware/swagger.auth.middleware.ts` — 입력·기대 비밀번호를 `console.log`로 찍던 줄 제거, `Logger`로 교체. `SWAGGER_ADMIN_PASSWORD` 미설정 시 `undefined === undefined`로 누구나 통과하던 문제도 함께 수정 (2026-10-22)
- [x] `src/utils/Api/search-index.client.ts` — 하드코딩된 내부 키 리터럴을 `INTERNAL_API_KEY` 환경 변수로 교체 (2026-10-22). git 히스토리에는 남아 있으므로 키 교체(rotate)는 별도 판단
- [x] `test/app/bootstrap.spec.ts`("no DB")가 실제로는 `.env`의 운영 Atlas에 연결하고 있었다 — `overrideModule(MongooseModule)`이 동적 모듈과 일치하지 않아 무효. `withFakeMongoose`(연결·모델 프로바이더 override)로 교체, 닿을 수 없는 `MONGODB_URI`로도 통과함을 확인 (2026-10-22)
- [ ] `test/posts.e2e-spec.ts`가 운영 DB에 붙는다. `mongodb-memory-server` 또는 전용 테스트 DB로 분리하기 전까지 로컬 실행 금지
- [ ] GitHub Dependabot이 기본 브랜치에서 취약점 110건을 보고(2026-10-21 push 시점: critical 2, high 60, moderate 42, low 6). [목록](https://github.com/JONGHYUNVAN/vans_story_be_post/security/dependabot)을 확인해 미사용 패키지 제거(아래 의존성 절)와 mongoose 8/9 마이그레이션으로 해소되는 건을 먼저 걷어내고, 남는 건은 `npm audit`로 개별 처리. critical 2건은 패키지와 영향 범위를 먼저 파악

### 의존성

- [x] `class-validator`, `class-transformer`, `dotenv`가 devDependencies에 있다(런타임 의존성). dependencies로 이동. 미추적 `Dockerfile`의 production 스테이지가 `npm install --omit=dev`라 그 이미지로는 `dotenv` 없이 기동 실패한다 (2026-10-22, 설치 버전 그대로 이동)
- [x] `@types/express-session`, `@types/swagger-ui-express`가 dependencies에 있다. devDependencies로 이동 (2026-10-22, `@types/swagger-ui-express`는 미사용이라 제거)
- [x] 미사용 패키지 제거(소스 import 없음 확인): `@nestjs/typeorm`, `typeorm`, `sqlite3`, `swagger-ui-express`, `express-basic-auth` (2026-10-22, knip·depcheck로 재확인. `@types/mongodb`, `source-map-support`도 함께 제거)
- [x] tsconfig `plugins`의 `@nestia/core`, `@nestia/sdk`, `typia` transform이 어디서도 쓰이지 않는다. 플러그인 설정과 `@nestia/sdk` devDependency 제거 (2026-10-22)
- [ ] `ts-node`, `tsconfig-paths`는 `.vscode/launch.json`의 "Debug Nest Framework" 설정만 쓴다. 그 설정을 안 쓰면 설정과 함께 제거 (이 설정은 `.env`를 읽어 운영 DB에 붙는다)
- [x] 범위 내 갱신(`npm update`) + `@nestjs/axios`의 peer `axios`를 `^1.20.0`으로 명시(그전엔 npm이 자동 설치한 1.8.3). mongoose 7.8.7→7.8.12(high `$nor` 인젝션 수정), express-session 1.19.0 등. `npm audit` 38건(critical 1, high 11) → 21건(critical 0, high 1), `--omit=dev` 0건 (2026-10-22)
- [ ] 남은 audit 21건은 모두 dev: `@faker-js/faker` high(10으로 메이저, ESM 전용 — CLAUDE.md 함정 2와 충돌하므로 결정 필요)와 jest 체인 moderate 20건(`babel-plugin-istanbul` → `@istanbuljs/load-nyc-config` → `js-yaml@3`. audit이 제안하는 `jest@25`는 다운그레이드라 무시, 고치려면 `overrides`)
- [x] 작은 메이저: `class-validator` 0.14.4 → 0.15.1(유일한 breaking은 `@IsIBAN` 옵션 인자 — 이 코드는 안 씀. `ValidationPipe`가 빌드된 `CreatePostDto`로 정상·거부 케이스를 그대로 처리함을 확인), `@types/supertest` 6 → 7 (2026-10-22)
- [ ] `dotenv` 17 — 직접 의존성 제거(설정·구조 절)가 먼저면 생략
- [ ] eslint 8(EOL) → 10 + `eslint-config-prettier` 10: `.eslintrc.js`를 flat config로 전환. CRLF 정리와 함께
- [ ] mongoose 7은 EOL. 8/9 마이그레이션은 단위 테스트 통과를 조건으로 별도 작업

### 설정·구조

- [x] `src/config/{cors,database,swagger}.ts` 죽은 코드 정리 (2026-10-23) — `database.ts` 삭제(연결은 `AppModule`의 `forRootAsync`). `cors.ts`·`swagger.ts`는 값이 현행과 달라 삭제하고, `main.ts`의 인라인 설정을 `src/config/cors.config.ts`(`createCorsOptions`)·`src/swagger/swagger.setup.ts`(`setupSwagger`)로 옮겼다. 같이 `@ApiBearerAuth('Authorization')` 4곳을 `@ApiBearerAuth()`로 통일
- [x] `src/main.ts` `app.listen(3001)` 하드코딩 → `PORT` 환경 변수, 기본 3001 (2026-10-22)
- [x] `package.json`의 `migrate:schema`, `migrate:categories` 스크립트가 가리키는 `scripts/migrate-*.js`가 없다. 스크립트 항목 삭제 (2026-10-22 `refactor/naming`)
- [x] `@nestjs/config` 도입 — `ConfigModule.forRoot({ isGlobal: true })`, `MongooseModule.forRootAsync`, `JwtModule.registerAsync`, `main.ts`는 `ConfigService`. `dotenv.config()` 호출 제거(`main.ts`, `app.module.ts`) (2026-10-22)
- [x] 기동 시 환경 변수 검증 — `validate` 함수 직접 작성(`src/config/env.validation.ts`, 라이브러리 없음). 필수 4개 + 선택 4개, 문제를 모아 한 번에 던지고 값은 메시지에 넣지 않음 (2026-10-22)
- [ ] **배포 전 확인**: 클라우드타입의 `NODE_ENV`가 `development|production|test` 중 하나인지, `CORS_ORIGINS`·`USER_SERVICE_URL`·`SEARCH_SERVICE_URL`이 `http(s)://`로 시작하는지. 아니면 기동이 실패한다
- [x] 남은 `process.env` 직접 읽기를 `ConfigService`로: `JwtStrategy`, `InternalApiClient`, `SwaggerAuthMiddleware`(`main.ts`에서 주입), 검색 클라이언트는 함수 → `SearchIndexClient` 서비스로 전환 (2026-10-22)
- [x] 직접 의존성 `dotenv` 제거 — `src/config/database.ts`의 `dotenv.config()` 삭제, 미사용 `test/test-setup.ts` 삭제 (2026-10-22)
- [ ] `npm start`의 `NODE_OPTIONS='--max-old-space-size=512'`는 POSIX 문법이라 Windows 셸에서 실패. `cross-env` 또는 스크립트 분리
- [x] 명명 통일 전환(2절 결정 4) + `forceConsistentCasingInFileNames: true` 복구 (2026-10-22 `refactor/naming`) — `docs/audits/2026-10-22-naming-review.md`

### 코드 품질

- [ ] `console.*` 남은 곳 → Nest `Logger`: `src/posts/posts.service.ts`의 `.catch` 3곳(`config/database.ts`·`post.init.ts`는 명명 전환 1단계에서 삭제). swagger 미들웨어와 search-index 클라이언트는 2026-10-22 교체 완료
- [ ] `any` 축소 — `src` 41곳(2026-10-22 전수조사 시점, 이전 집계 38곳). `noImplicitAny: true`, eslint `no-explicit-any` 활성화 검토
- [ ] eslint 8 + legacy `.eslintrc.js`. flat config 전환은 @typescript-eslint 8 지원 범위 확인 후

### 자동화

- [ ] CI 워크플로 없음. GitHub Actions로 `npx tsc --noEmit -p tsconfig.json`, `npm run build`, `npm test`(DB 불필요 항목만) 실행
- [x] 배포 환경 Node 26 이상 확인(`engines.node >= 26.0.0`). 클라우드타입 Node 프리셋에 26이 없어 Dockerfile 템플릿으로 배포한다 — 2026-10-25 전환 완료. 새 서비스 `vansdevblog-be-post`(Dockerfile, 브랜치 main, Port 3001, Dockerfile path·Start commands 비움)가 `www.vansdevblog.online`을 서빙하고, 컨테이너 Node는 26.12.1. 기본 주소·운영 도메인에서 `/api/v1/categories`·`/api/v1/posts` 200, Vercel 프런트 BFF·CORS 프리플라이트 정상 확인. 옛 `vans-story-be-post`(node@22)는 정지 상태로 남김 — 며칠 뒤 삭제. 전환 중 걸린 것: 생성 화면이 옛 브랜치(`test/e2e-test-database`)를 골라 Dockerfile을 못 찾음(브랜치 main으로), Port를 비우면 공개 주소가 안 생기고 도메인 연결 목록에도 안 뜸, 도메인 연결 입력은 스킴·슬래시 없는 호스트명만
- [x] 로컬 Node 26 설치(`nvm install 26`). 현재 nvm에는 18/22/23뿐이라 `npm test`가 한 건도 못 돈다(Nest 12 ESM → jest `require(esm)`은 Node 24.9+). 2026-10-22 변경분의 단위 테스트는 이 이유로 **미검증** — tsc만 통과 (2026-10-22 Node 26.8.1에서 `npm test` 4 스위트 47건, `npm run build` 통과 확인 — 기준 커밋 `5134a0b`)

### 표준 준수 (2026-10-22 전수조사)

`docs/audits/2026-10-22-nest-standards.md`의 3절 묶음을 순서대로. 위 절에 이미 있는 항목(RolesGuard, console, `config/*`, `migrate:*`, eslint, CRLF, `forceConsistentCasing`, e2e 운영 DB)은 여기서 다시 적지 않는다. 브랜치는 묶음마다 main에서 딴다.

- [x] **A. 데이터·검증 버그** (`fix/data-validation`, 2026-10-22) — 배포 전 확인: 운영 `posts.subCategoryId` 중 categories에 없는 id 개수(있으면 populate가 `null`이 되어 id가 응답에서 사라짐), 운영 `categories.group` 값이 `CategoryGroup` 6개 안에 있는지. 배포 후 검색 인덱스 재색인
  - [x] #1 `post.schema.ts`의 `subCategoryId`에 `ref: 'Category'`가 없어 쿼리 populate가 건너뛰어진다 → 응답의 `subCategory`/`subCategoryLabel`이 항상 빈 값, 검색 인덱스에 `subCategory: ''`. 단위 테스트는 populate된 픽스처라 이 버그를 가린다. ref 추가 + 스키마 테스트, 배포 후 검색 인덱스 재색인
  - [x] #5 필수 문자열(`description`, `topic`, `language`, 카테고리 `value`/`label`/`path`)이 `@IsString()`뿐 → 빈 문자열이 mongoose `required`에서 실패해 500. `@IsNotEmpty()`. 수정 경로는 500이 아니라 빈 값·`null`이 200으로 저장되던 것 — `PartialType(…, { skipNullProperties: false })` + `runValidators: true`
  - [x] #6 형식이 틀린 `:id` — 카테고리는 `CastError` 500, 게시글은 404. `src/common/pipes/parse-object-id.pipe.ts`(패키지 파이프는 입력값을 메시지에 넣고 12자 문자열도 통과시켜 자체 구현)로 400. e2e 기대값 404→400
  - [x] #19 카테고리 `group`은 Swagger에만 enum, 검증 없음 → `CategoryGroup` enum + `@IsEnum` + 스키마 `enum`
  - [x] #4 목록 `limit` 상한 — `FindPostsQueryDto`(`limit` 1~50, `page` 정수 1 이상)
  - [x] (검증 N4) 게시글 생성·카테고리 변경 시 메인·서브 카테고리 존재와 부모 관계 확인(400)
- [x] **B. 권한** (2026-10-22 `fix/authorization`) — 위 보안 절 RolesGuard 항목(Spring `auth` 클레임 형식 확인이 선행). `Role` enum(#19)과 `AuthModule`의 `RolesGuard`·`Reflector` 정리(#14)를 같이
- [ ] **C. Swagger·문서 정확성** (`docs/swagger-contract`)
  - [ ] #7 게시글의 `@ApiBearerAuth('Authorization')`가 문서에 없는 스킴 이름(등록된 건 `bearer`) → Swagger UI가 토큰을 안 붙임. DELETE는 204로 문서화했지만 `@HttpCode` 없어 200. 목록 응답을 `ResponseDto[]`로 선언(실제 `{ data, meta }`). `thumbnail`이 필수로 표시 — 스킴 이름은 명명 전환에서 `@ApiBearerAuth()`로 고침, 나머지 남음
  - [ ] #8 `swagger-spec.json` 생성 스크립트(1-2절 생성물 정리와 같이)
  - [ ] #30 JSDoc 오류: `x-viewed` 설명이 동작과 반대, 서브 카테고리 설명이 마이그레이션 전 구조(Swagger에 노출), 컨트롤러 JSDoc의 요청/응답 JSON 예시(옛 `theme`/`category` 필드) 삭제, `@module` 값 정리
- [ ] **D. 설정·파이프라인·로깅** (`refactor/pipeline`)
  - [ ] #10·#11은 위 보안 절. #20 `APP_PIPE`(2절 결정 9), #21 `app.useBodyParser('json', { limit: '10mb' })`, #22 Swagger 미들웨어 형태(결정 10)와 `express-session` `SessionData` 선언 병합
  - [ ] #12 외부 클라이언트 오류 은닉: `UserServiceClient`는 실패를 로그 없이 `null`, `SearchServiceClient`는 `res.ok`를 확인하지 않음
  - [ ] #26 `SearchServiceClient`: 필수 `INTERNAL_API_KEY`를 호출마다 `get() ?? ''`로 읽음 → 생성자 `getOrThrow` (Logger 이름은 명명 전환에서 `SearchServiceClient.name`)
  - [ ] #14 `AppModule`의 `HttpModule`, 쓰이지 않는 export(`PostsService`, `CategoriesService`, `PassportModule`) 제거
  - [ ] #27 `main.ts` 정리: logger 배열(`'verbose'` 중복, 전체가 기본값과 같음), `@nestjs/common` import 두 줄, `void bootstrap()`
- [ ] **E. 죽은 코드·중복** (`refactor/cleanup`)
  - [ ] #16 미사용 조회 메서드 3개(`findByAuthor`·`searchPosts`·`findByThemeAndCategory`)와 테스트 — 2절 결정 13. 나머지(`pagination/DTO/dto.ts`, `PostInitService`, `MockAuthModule`, `swagger:serve`·`swagger:open`, `config/*`)는 명명 전환 1단계에서 삭제
  - [ ] #17 `PostsService` 중복: populate 체인 8회, `SearchIndexPayload` 조립 2회, 경로마다 다른 응답 필드(`findAll/findOne/findForEdit/update`는 `mainCategory`만 채움). A의 #1과 같이 보면 좋다
  - [x] #18 `UpdatePostDto` → `PartialType(CreatePostDto, { skipNullProperties: false })` — A의 #5와 같이 처리(2026-10-22)
  - [x] #15 `PostsModule`이 `Category` 모델을 다시 `forFeature` → `CategoriesModule`이 `MongooseModule` export (2026-10-23)
  - [ ] #13 `JwtAuthGuard`의 미사용 `JwtService` 주입 제거(2절 결정 8)
- [x] **F. 명명·구조 전환** (2026-10-22 `refactor/naming`) — 폴더·파일(CLI 평면 구조), 클래스·메서드·변수·상수, 테스트 이름·위치, `test/*` 별칭, `forceConsistentCasingInFileNames`. 계획·결과는 `docs/audits/2026-10-22-naming-review.md`, 규칙은 `docs/conventions.md` 2절
  - [ ] #24 `@CurrentUser()` 데코레이터(컨트롤러의 `@Request() request: any`)
  - [ ] #25 `HydratedDocument<X>`, 주입 타입 `Model<X>`로 통일
  - [ ] #28 `CategoriesService` 단위 테스트(정상·예외)
  - [ ] #33 서식(4칸 들여쓰기, 끝 개행) — CRLF 정리(결정 2) 후 `prettier --write`
  - [ ] #34 `build` 스크립트 `echo` 제거, `tsconfig.build.json` `include: ["src"]`, jest `collectCoverageFrom`을 `src/**`로
- [ ] **G. API 계약 변경** — 2절 결정 5·7 확정 후 프런트(`vans_story`)와 같이 배포

---

- [ ] 운영 Atlas에서 `scripts/migrate-category-id-types.js` 실행(배포 후 1회, 절차 `docs/history/2026-10-25-category-id-types.md`). 2026-10-25 새 백엔드 전환 뒤 API로 만든 글(`posts/6ade12e7a26d691e30272c0a`)의 `mainCategoryId`/`subCategoryId`가 문자열로 저장돼 카테고리 필터 목록에서 빠진다. 이 PC는 Atlas IP 미등록이라 허용된 곳에서 돌리거나, 한 건이면 관리자 토큰으로 같은 id를 `PATCH`해도 된다

## 4. 참고 자료

- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — CLAUDE.md 범위, 200줄 기준, `.claude/rules/`와 `paths` frontmatter, `@import`, `CLAUDE.local.md`, AGENTS.md
- [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory) — `.claude/` 아래 파일별 역할과 커밋 여부
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) — CLAUDE.md 포함/제외 표, "지우면 실수하는가" 기준, skills·hooks로 뺄 것
- [Configure permissions](https://code.claude.com/docs/en/permissions) — `Read(./.env)`, `Bash(prefix*)` deny 규칙 문법, deny 우선 원칙
- [nestjs/nest](https://github.com/nestjs/nest) — 루트 문서 구성(README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, LICENSE, 루트 CHANGELOG 없음)
- [brocoders/nestjs-boilerplate](https://github.com/brocoders/nestjs-boilerplate), [docs 목차](https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/readme.md) — `docs/` 주제 분리(architecture, auth, database, tests 등), `.claude/skills` 사용 예
- [GitHub community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) — SECURITY.md의 표준 역할(취약점 신고)
- [NestJS agent instructions (awesome-copilot)](https://awesome-copilot.github.com/instruction/nestjs/) — Nest 에이전트 규칙의 표준 범주(DI, 모듈, DTO 검증, 예외 필터, 로깅, 설정 검증, 테스트)
