# CLAUDE.md

Vans Dev Blog의 게시글·카테고리 서비스. NestJS 12 + mongoose 7(MongoDB Atlas) + TypeScript 6.0, CommonJS 출력, 기본 포트 3001.
Vercel 프런트엔드(`vans_story`)가 BFF로 호출한다. 작성자 닉네임은 Spring 사용자 서비스에서 받아오고, 게시글 변경은 Django 검색 서비스로 fire-and-forget 전송한다.
정비 계획·기술 부채는 `TODO.md`, 결정 근거는 `docs/decisions.md`, 구조 설명은 `docs/architecture.md`에 있다.

## 명령

| 용도 | 명령 |
|---|---|
| 타입 검사 | `npx tsc --noEmit -p tsconfig.json` |
| 단위 테스트 (DB·네트워크 불필요) | `npm test` — `*.spec.ts`만 돈다. `*.e2e-spec.ts`는 testRegex에 걸리지 않는다 |
| 단일 테스트 | `npm test -- -t "테스트 이름"` |
| 빌드 | `npm run build` → `dist/` |
| 포맷 확인 | `npx prettier --check <새 파일>` — 전체 `npm run lint`·`npm run format`은 실행하지 않는다 (CRLF 체크아웃의 `Delete ␍` 오류 수천 건 + 기존 파일 전체가 재포맷되어 diff가 터진다) |
| Swagger HTML | `npm run swagger:build:clean` → `docs/swagger/clean.html` (추적됨) |
| typedoc | `npm run docs` → `docs/typedoc/` (gitignore) |

실행 금지 — `.claude/settings.json`이 deny한다:

| 명령 | 이유 |
|---|---|
| `npm run start*`, `node dist/main` | `.env`의 운영 MongoDB Atlas에 붙는다 |
| `npm run test:e2e`, `npm run test:all*` | e2e가 운영 DB에 쓴다 |
| `.env` 읽기 | 비밀값. 변수 이름은 `.env.example` |

`npm run migrate:*`는 참조하는 스크립트 파일이 없다 (`scripts/`에는 `generate-swagger-clean.js`뿐).

## 요청 흐름과 레이어 책임

`main.ts`: 전역 `ValidationPipe`(whitelist + forbidNonWhitelisted + transform) → CORS → express-session → `express.json`(10mb) → `SwaggerAuthMiddleware`(`/api/posts/swagger*`만)
→ 라우트별 `@UseGuards(JwtAuthGuard)` → Controller → Service → mongoose Model → `mapToDto` → Response DTO

- **Controller**: 파라미터 파싱과 Swagger 데코레이터만. 비즈니스 로직·DB 접근 금지. `request.user`는 `{ sub: 이메일, role }`.
- **Service**: 검증 실패·권한·없음은 Nest `HttpException`(`BadRequest/Forbidden/NotFound/Conflict`)을 던진다. 전역 예외 필터는 없다. try/catch로 삼키지 않는다.
- **Model 조회 체인**: `.populate('mainCategoryId', 'value label').populate('subCategoryId', 'value label').lean().exec()`. 단위 테스트의 모의 객체가 이 체인을 그대로 흉내 내므로 체인을 바꾸면 `test/helpers/test-utils.ts`의 `mockQuery`도 바꾼다.
- **Response DTO**: `mapToDto(entity, Dto)`는 `@Field`가 붙은 속성만 복사하고 `Date`는 `toLocaleString()` 문자열로 바꾼다. 새 응답 필드에는 `@Field`와 `@ApiProperty`를 둘 다 붙인다. `author`, `mainCategory` 같은 파생 필드는 Service가 채운다.
- **페이지네이션**: 응답 타입은 `src/utils/types/pagination.ts`의 `Paginated<T>`. `src/utils/pagination/DTO/dto.ts`는 미사용.
- **외부 호출**: 사용자 서비스는 `InternalApiClient`(DI, 실패 시 `null`). 검색 서비스는 `search-index.client.ts`의 `indexPost/deletePostIndex`(fire-and-forget, `.catch`로 로그만). 응답을 기다리지 않는다.
- **권한 검사**는 Service에서 `userEmail`/`userRole`로 한다. `@Roles()`는 `RolesGuard`가 어디에도 등록되어 있지 않아 효력이 없다 (`TODO.md` 3절 보안).

## 명명과 import

- 새 파일은 Nest 표준: 소문자 폴더, `<feature>.<layer>.ts` (예: `src/modules/category/service/category.service.ts`).
- 예외(그대로 둔다): post 모듈은 `Controller/controller.ts`, `DTO/`, `Service/service.ts`, `Module/module.ts`; utils는 `Authorization/Guard/auth.ts`처럼 PascalCase 폴더. 작업 중에 리네임하지 않는다 — Windows에서 대소문자만 바뀐 리네임은 `git mv` 두 단계가 필요하고, `forceConsistentCasingInFileNames`가 꺼져 있어 컴파일러가 잡지 못한다.
- import는 `src/...` 절대경로 (tsconfig `paths`, jest `moduleNameMapper` 모두 지원). 기존 상대경로는 손대는 파일에서만 바꾼다.

## 코딩 규칙

- **환경 변수**: `process.env`는 생성자·팩토리·함수 안에서 읽는다. 모듈 최상단 상수로 읽지 않는다 (함정 5). 필수값이 없으면 기동 시 `throw`한다 (`InternalApiClient` 방식). 새 변수는 `.env.example`에 이름을 추가한다.
- **로깅**: `@nestjs/common`의 `Logger` (`new Logger(ClassName.name)`). `console.*` 금지. URI·토큰·비밀번호·API 키는 어떤 레벨에도 찍지 않는다.
- **`any`**: 새로 쓰지 않는다. `noImplicitAny: false`라 컴파일러가 잡지 않는다. populate 결과는 `test/helpers/test-utils.ts`의 `PopulatedCategoryRef`처럼 타입을 선언한다.
- **JSDoc**: 공개 클래스·메서드에 한국어 JSDoc (typedoc 생성 대상). 요청/응답 예시는 Swagger 데코레이터에 두고 JSDoc에 중복하지 않는다.
- **DTO**: `.claude/rules/dto.md`. **스키마**: `.claude/rules/schemas.md`.

## 테스트

- `npm test`는 DB·네트워크 없이 돈다. 새 테스트도 그래야 한다.
- Service 단위 테스트: `test/helpers/test-utils.ts`의 `createMockPostModel / createMockCategoryModel / createMockApiClient / mockQuery`와 픽스처를 쓴다. 검색 클라이언트는 `jest.mock(...search-index.client)`.
- 모듈 기동 테스트: `test/app/bootstrap.spec.ts` 패턴 — `import './env'`를 `AppModule`보다 먼저, `overrideModule(MongooseModule).useModule(FakeMongooseModule)`.
- DTO 모의 데이터: `MockGenerator.createMock(CreateDto)` (class-validator 검증 통과를 보장).
- 상세: `.claude/rules/testing.md`.

## 보안·비밀

- `.env`는 읽지 않는다. `JWT_SECRET`은 base64 문자열이며 `Buffer.from(…, 'base64')`로 디코딩해 HS512 검증에 쓴다.
- `INTERNAL_API_KEY` 하나를 사용자 서비스(`X-API-KEY`)와 검색 서비스(`X-Internal-Key`)가 공유한다. 소스에 키 리터럴을 쓰지 않는다.
- 에러 응답에 스택·내부 URI·접속 문자열을 넣지 않는다.

## 함정

1. **가드 DI 범위**: Nest 12에서 `@UseGuards(JwtAuthGuard)`의 의존성(`JwtService`)은 가드를 쓰는 모듈 안에서 해석된다. 가드를 쓰는 모듈은 `AuthModule`을 `imports`에 넣는다. 빠뜨리면 `bootstrap.spec.ts`가 잡는다.
2. **CJS 유지**: `module: nodenext`지만 `package.json`에 `"type": "module"`이 없어 CommonJS로 출력된다. `"type": "module"` 추가, ESM 전용 패키지 도입, `import.meta` 사용 금지. 기본 import는 `esModuleInterop`으로 동작한다 (`import session from 'express-session'`).
3. **TypeScript `~6.0.x` 고정**: 7.x로 올리지 않는다. 스키마·DTO는 `strictPropertyInitialization`이 꺼진 상태를 전제로 작성되어 있다.
4. **Node 24.9 이상에서만 테스트가 돈다**: Nest 12 패키지가 ESM이라 jest가 `require(esm)`을 쓴다. Node 23 이하에서는 `npm test`의 모든 스위트가 "Must use import to load ES Module"로 실패한다 — 코드 문제가 아니다. `node -v`로 먼저 확인하고, 없으면 `nvm install 26` 후 `nvm use 26`. `npx tsc --noEmit`은 23에서도 된다. `engines.node >= 26`은 바꾸지 않는다.
   Windows에서 `npm`이 띄우는 `cmd.exe`가 `node`를 못 찾으면(`'node'은(는) … 아닙니다`) PATH 앞에 `C:\Users\<user>\AppData\Roaming\nvm\v<버전>`을 넣고 다시 실행한다. `npm ci`가 이 이유로 실패하면 exit code는 0이 아니니 `| tail`로 가리지 말 것.
5. **dotenv 호이스팅**: `import`가 호이스팅되므로 `main.ts`의 `dotenv.config()`보다 `app.module.ts`의 데코레이터(`MongooseModule.forRoot(process.env.MONGODB_URI!)`)가 먼저 평가된다. 그래서 `app.module.ts`에도 `dotenv.config()`가 있다. `@nestjs/config` 도입 전까지 지우지 않는다.
6. **`NODE_OPTIONS='…'` POSIX 문법**: `npm start`는 Windows PowerShell에서 실패한다 (어차피 실행 금지). 스크립트에 셸 의존 문법을 추가하지 않는다.
7. **`SwaggerAuthMiddleware.use`는 화살표 속성**: `main.ts`가 `new SwaggerAuthMiddleware().use`로 바인딩 없이 넘기므로 일반 메서드로 바꾸면 `this`가 사라진다.

## 변경 체크리스트

1. `npx tsc --noEmit -p tsconfig.json`
2. `npm test` — 새 Service 메서드는 정상·예외 케이스 각각
3. 엔드포인트 추가·변경 시 Swagger 데코레이터 → `.claude/skills/add-endpoint/SKILL.md`
4. 새 파일은 `npx prettier --check <파일>` 통과. 기존 파일은 대부분 prettier를 통과하지 못하므로(`main.ts`, swagger 미들웨어 등) 파일 전체를 `--write`하지 말고 손댄 줄만 주변 스타일에 맞춘다
5. `TODO.md`의 해당 항목 체크. 결정이 있었으면 `docs/decisions.md`에 날짜와 근거
6. 커밋 메시지: `type: 한국어 요약` (`feat/fix/docs/chore/test/refactor`), 본문에 이유
