# TODO

이 저장소의 문서 정비 계획, 결정 대기 항목, 기술 부채 목록이다.
작업 규칙은 `CLAUDE.md`, 결정 근거는 `docs/decisions.md`에 둔다.
끝낸 항목은 체크하고, 더 이상 유효하지 않은 항목은 지운다.

최종 갱신: 2026-10-22 (조사 기준 커밋: `65a3855`, Node 26 / NestJS 12 / TypeScript 6.0 업그레이드 병합 직후. 1-1절·1-2절 신규 파일과 보안 최우선 항목 처리)

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
- [ ] 생성물 정리 — `docs/swagger/README.md`, `docs/swagger/clean.html`, `swagger-spec.json`이 강제 추가돼 있다. 생성물은 untrack하고 생성 명령만 CLAUDE.md에 적는다. 0바이트 `db.sqlite` 삭제.
  (2026-10-22: `.gitignore`를 `/docs` → `/docs/typedoc`으로 좁히고 typedoc `out`을 `docs/typedoc`으로 옮겨 `docs/*.md`를 커밋할 수 있게 했다. swagger 생성물은 아직 추적 중)
  **확인 필요**: Swagger HTML을 GitHub Pages 등 외부에서 쓰고 있으면 untrack하지 않는다.

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
| 3 | 환경 변수 접근 | `@nestjs/config` 없음. `dotenv.config()`가 `main.ts`, `app.module.ts`, `config/database.ts` 3곳에서 호출, `process.env` 직접 읽기 9개 파일 | 단기: 새 코드는 `process.env`를 모듈 최상단이 아닌 생성자·팩토리 안에서 읽고, 필수값 누락 시 기동 실패시킨다. 장기: `@nestjs/config` + 스키마 검증 도입(3절, 함정 2의 dotenv 호이스팅 문제도 함께 해소) | 지금 바로 `@nestjs/config` 도입(문서 작업 범위를 넘음) |
| 4 | 명명 전환 시점 | post 모듈: PascalCase 폴더 + 일반 명사 파일명(`Controller/controller.ts`). category 모듈: Nest 표준(`controller/category.controller.ts`). utils: 혼재 | 새 코드는 Nest 표준(소문자 폴더, `<feature>.<layer>.ts`). 기존 파일 전환은 별도 작업으로, `forceConsistentCasingInFileNames: true` 복구와 함께 진행. Windows에서 대소문자만 바꾸는 리네임은 `git mv` 두 단계 필요 | 문서 작업과 동시에 전환(리뷰 범위가 커짐) |

---

## 3. 기술 부채

우선순위 순. CLAUDE.md의 "함정" 절에는 작업 규칙만 넣고, 고쳐야 할 것은 여기에 둔다.

### 보안

- [ ] **`RolesGuard`가 어디에도 등록되어 있지 않다.** `@Roles('admin')`이 붙은 게시글 생성·삭제도 인증만 통과하면 누구나 호출할 수 있다. 게다가 Spring이 발급하는 `auth` 클레임은 `ROLE_ADMIN` 형식이라 `RolesGuard`를 그냥 켜면 관리자도 막힌다. 해결 순서: (1) Spring `JwtProvider`의 `auth` 클레임 형식 확인(쉼표 구분 문자열인지) → (2) `JwtStrategy.validate`에서 `ROLE_ADMIN` → `admin`으로 정규화 또는 `@Roles('ROLE_ADMIN')` → (3) `@UseGuards(JwtAuthGuard, RolesGuard)` 또는 `APP_GUARD` 등록 → (4) `PostsService.update`의 `userRole !== 'admin'` 비교도 같이 맞춤. **최우선**
- [x] `src/main.ts:82` — MongoDB URI 로그 제거 (2026-10-22)
- [x] `src/swagger/middleware/swagger.auth.middleware.ts` — 입력·기대 비밀번호를 `console.log`로 찍던 줄 제거, `Logger`로 교체. `SWAGGER_ADMIN_PASSWORD` 미설정 시 `undefined === undefined`로 누구나 통과하던 문제도 함께 수정 (2026-10-22)
- [x] `src/utils/Api/search-index.client.ts` — 하드코딩된 내부 키 리터럴을 `INTERNAL_API_KEY` 환경 변수로 교체 (2026-10-22). git 히스토리에는 남아 있으므로 키 교체(rotate)는 별도 판단
- [ ] `test/post/e2e/posts.e2e-spec.ts`가 운영 DB에 붙는다. `mongodb-memory-server` 또는 전용 테스트 DB로 분리하기 전까지 로컬 실행 금지
- [ ] GitHub Dependabot이 기본 브랜치에서 취약점 110건을 보고(2026-10-21 push 시점: critical 2, high 60, moderate 42, low 6). [목록](https://github.com/JONGHYUNVAN/vans_story_be_post/security/dependabot)을 확인해 미사용 패키지 제거(아래 의존성 절)와 mongoose 8/9 마이그레이션으로 해소되는 건을 먼저 걷어내고, 남는 건은 `npm audit`로 개별 처리. critical 2건은 패키지와 영향 범위를 먼저 파악

### 의존성

- [ ] `class-validator`, `class-transformer`, `dotenv`가 devDependencies에 있다(런타임 의존성). dependencies로 이동. 미추적 `Dockerfile`의 production 스테이지가 `npm install --omit=dev`라 그 이미지로는 `dotenv` 없이 기동 실패한다
- [ ] `@types/express-session`, `@types/swagger-ui-express`가 dependencies에 있다. devDependencies로 이동
- [ ] 미사용 패키지 제거(소스 import 없음 확인): `@nestjs/typeorm`, `typeorm`, `sqlite3`, `swagger-ui-express`, `express-basic-auth`
- [ ] tsconfig `plugins`의 `@nestia/core`, `@nestia/sdk`, `typia` transform이 어디서도 쓰이지 않는다. 플러그인 설정과 `@nestia/sdk` devDependency 제거
- [ ] mongoose 7은 EOL. 8/9 마이그레이션은 단위 테스트 통과를 조건으로 별도 작업

### 설정·구조

- [ ] `src/config/{cors,database,swagger}.ts`는 어디서도 import하지 않는 죽은 코드. 삭제하거나 `main.ts`의 인라인 설정을 이쪽으로 옮기거나 둘 중 하나로 결정
- [x] `src/main.ts` `app.listen(3001)` 하드코딩 → `PORT` 환경 변수, 기본 3001 (2026-10-22)
- [ ] `package.json`의 `migrate:schema`, `migrate:categories` 스크립트가 가리키는 `scripts/migrate-*.js`가 없다. 스크립트 항목 삭제
- [ ] `@nestjs/config` 도입 + 기동 시 환경 변수 스키마 검증(2절 결정 3 장기안)
- [ ] `npm start`의 `NODE_OPTIONS='--max-old-space-size=512'`는 POSIX 문법이라 Windows 셸에서 실패. `cross-env` 또는 스크립트 분리
- [ ] 명명 통일 전환(2절 결정 4) + `forceConsistentCasingInFileNames: true` 복구

### 코드 품질

- [ ] `console.*` 남은 곳 → Nest `Logger`: `src/config/database.ts`(죽은 코드, 삭제 대상), `src/database/init/post.init.ts`, `src/modules/post/Service/service.ts`의 `.catch` 3곳. swagger 미들웨어와 search-index 클라이언트는 2026-10-22 교체 완료
- [ ] `any` 38곳 축소. `noImplicitAny: true`, eslint `no-explicit-any` 활성화 검토
- [ ] eslint 8 + legacy `.eslintrc.js`. flat config 전환은 @typescript-eslint 8 지원 범위 확인 후

### 자동화

- [ ] CI 워크플로 없음. GitHub Actions로 `npx tsc --noEmit -p tsconfig.json`, `npm run build`, `npm test`(DB 불필요 항목만) 실행
- [ ] 배포 환경 Node 26 이상 확인(`engines.node >= 26.0.0`). 미추적 `Dockerfile`은 `node:24-alpine`. CloudType 빌드 설정의 Node 버전도 확인
- [ ] 로컬 Node 26 설치(`nvm install 26`). 현재 nvm에는 18/22/23뿐이라 `npm test`가 한 건도 못 돈다(Nest 12 ESM → jest `require(esm)`은 Node 24.9+). 2026-10-22 변경분의 단위 테스트는 이 이유로 **미검증** — tsc만 통과

---

## 4. 참고 자료

- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — CLAUDE.md 범위, 200줄 기준, `.claude/rules/`와 `paths` frontmatter, `@import`, `CLAUDE.local.md`, AGENTS.md
- [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory) — `.claude/` 아래 파일별 역할과 커밋 여부
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) — CLAUDE.md 포함/제외 표, "지우면 실수하는가" 기준, skills·hooks로 뺄 것
- [Configure permissions](https://code.claude.com/docs/en/permissions) — `Read(./.env)`, `Bash(prefix*)` deny 규칙 문법, deny 우선 원칙
- [nestjs/nest](https://github.com/nestjs/nest) — 루트 문서 구성(README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, LICENSE, 루트 CHANGELOG 없음)
- [brocoders/nestjs-boilerplate](https://github.com/brocoders/nestjs-boilerplate), [docs 목차](https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/readme.md) — `docs/` 주제 분리(architecture, auth, database, tests 등), `.claude/skills` 사용 예
- [GitHub community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) — SECURITY.md의 표준 역할(취약점 신고)
- [NestJS agent instructions (awesome-copilot)](https://awesome-copilot.github.com/instruction/nestjs/) — Nest 에이전트 규칙의 표준 범주(DI, 모듈, DTO 검증, 예외 필터, 로깅, 설정 검증, 테스트)
