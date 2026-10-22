# 전수조사 검증과 구현 계획 (2026-10-22)

`docs/audits/2026-10-22-nest-standards.md`(이하 "감사 문서")를 다른 PC에서 받아 코드와 다시 대조한 결과와, 그 결과를 반영한 구현 순서다. 감사 문서는 스냅샷이라 고치지 않고, 정정은 이 문서에 둔다. `#N`은 감사 문서 1절 표의 행 번호.

- 검증 기준: `7c03db6`(감사 문서 커밋). `5134a0b` 이후 바뀐 것은 문서 3개뿐이라 감사 문서의 `file:line`이 그대로 유효
- 실행: `npx tsc --noEmit` 통과(Node 23.3.0). Node 26.12.1 설치 후 `npm test` 4 스위트 / 47건 통과, `npm run build` 통과. 빌드 출력이 `'빌드 시작...'`처럼 따옴표째 찍혀 #34의 `echo` 지적도 확인
- 교차 확인: 사용자 서비스 `D:\blog\vans_story_be`(`JwtProvider.kt`, `OAuthService.kt`, `CustomUserDetailsService.kt`), 프런트 `D:\blog\vans_story\src`

---

## 1. 검증 결과

35행 모두 **지적 내용 자체는 맞다**. 틀린 행은 없고, 아래는 영향 판단·줄 번호·숫자의 정정이다.

### 1-1. 판단이 바뀌는 정정

| # | 감사 문서 | 정정 |
|---|---|---|
| 3 | fail-open, 영향은 "추정"(Spring 토큰에 `auth`가 빠지는지에 달림) | **확정.** Spring `JwtProvider.kt:94,100`이 access·refresh 모두에 `auth`를 항상 넣는다 → fail-open 경로는 실제 토큰으로 도달하지 않음(방어 심층, 낮음). 대신 **반대 버그가 실재**: `auth` 값은 OAuth 경로 `ROLE_ADMIN`(`OAuthService.kt:192`), 일반 경로 `ADMIN`(`CustomUserDetailsService.kt:119`), 여러 개면 쉼표 구분. `'admin'`과 같아지는 경우가 없어 `service.ts:369`의 관리자 예외가 **한 번도 발동하지 않는다**(관리자도 남의 글 수정 시 403). `TestAuthGuard`의 `role: 'admin'`이 이를 가린다 |
| 2 | Spring `auth` 형식 확인이 선행 조건(TODO 보안 1단계) | **선행 조건 해소.** 위 형식으로 확인됨. `RolesGuard`(`role.ts`)는 `includes(user.role)` 정확 일치라, 정규화 없이 등록하면 관리자 엔드포인트가 전원 403 → 정규화와 등록은 같은 커밋 |
| 1 | 응답 `subCategory`가 항상 `''`, 검색 인덱스 `subCategory: ''` | 실제로 영향받는 경로는 `create` 응답과 검색 인덱스 페이로드(`service.ts:101,398`)뿐. `findAll/findOne/findForEdit/update`는 #1과 무관하게 sub를 채우지 않는다(#17). **추가 위험**: ref를 붙이면 Category에 없는 `subCategoryId`는 populate 결과가 `null`이 되어 id가 응답에서 사라진다. 마이그레이션 스크립트가 커밋된 적이 없어 데이터 상태를 코드로 확인할 수 없음 → 배포 전 고아 id 개수 확인 필요(운영 DB 읽기, 사용자 작업) |
| 5 | 빈 문자열 → mongoose `ValidationError` → 500 (create·update 모두) | create는 맞다. **update는 다르다**: `findByIdAndUpdate`에 `runValidators`가 없어(`service.ts:374`, `category.service.ts:149`) `''`이 **200으로 조용히 저장**된다. `@IsOptional()`은 `null`도 통과시켜 필수 필드를 `null`로 덮어쓸 수 있다 → 수정 범위에 update 경로 포함 |
| 7(e) | `mainCategoryId`/`subCategoryId`가 populate 객체로 나감 | `mainCategoryId`만. `subCategoryId`는 #1 때문에 원시 ObjectId. #1 수정 후에 둘 다 성립 |
| 34 | `collectCoverageFrom`이 `dist`·`scripts`까지 포함 | **틀림.** jest `roots: [src, test]`로 범위가 제한돼 포함되지 않는다. 실제로 끼는 것은 `test/helpers/*`. 또 CJS 템플릿(`files/ts`)은 jest를 쓰므로 "jest 대신 vitest"는 ESM 기본값과의 차이일 뿐 |

### 1-2. 숫자·줄 번호 정정

| 위치 | 감사 문서 | 실제 |
|---|---|---|
| #17, TODO 코드 품질 | `any` 41곳, "`as any` 다수(41곳)" | 주석 제외 **45회 / 42줄**(`service.ts` 28회), `as any`는 **24회**. 집계 기준을 같이 적을 것 |
| #26 | `search-index.client.ts:42,51,65,82,95` | 키를 `get() ?? ''`로 읽는 곳은 **65, 95**뿐. 51, 82는 OPTIONAL인 `SEARCH_SERVICE_URL`이라 `get`이 맞다 |
| #12 | `res.ok` 미확인 | `deletePostIndex`(`:92-98`)도 같음 |
| #13, #22 | 함정 1 `CLAUDE.md:73`, 함정 7 `:80` | **:72**, **:79**. 함정 7 본문의 `new SwaggerAuthMiddleware().use`는 인자가 빠진 옛 문장 |
| #20 | `docs/architecture.md:334` | **:40** |
| #25 | `.claude/rules/schemas.md:6` | **:7** |
| #32 | test 29곳 중 `src/...` 4곳 | 3곳(`require` 1곳을 세면 4지만 분모 기준이 섞임) |
| #33 | 끝 개행 없는 파일 16개 "`main` 외" | 16개는 맞지만 `main.ts`는 끝 개행이 **있다** |
| 2절 | 바뀌는 import 약 58곳, test 파일 5개, `service.spec.ts` 자기 import 13개, e2e 9개 | 행별 숫자는 24행 모두 일치. 합계는 **53**, test 파일 **6**개(`fake-mongoose.ts` 포함), 자기 import는 각각 내부 경로 **8**개 |

### 1-3. 감사 문서가 놓친 것

| 신규 | 내용 | 영향 | 묶음 |
|---|---|---|---|
| N1 | **refresh 토큰이 access 토큰으로 통과한다.** Spring이 두 토큰을 같은 클레임(`sub`, `auth`, `exp`)·같은 키로 만들고 만료만 다르다. 이 서비스는 구분할 근거가 없어 7일짜리 refresh 토큰으로 쓰기 API 호출 가능 | 보안 | B 후속(레포 간: Spring이 `typ` 클레임 추가 → 이 서비스가 `typ !== 'access'` 거부) |
| N2 | `JwtStrategy`에 `algorithms: ['HS512']` 없음 → HS256/384 서명도 받음 | 보안(낮음) | B |
| N3 | Swagger 로그인 성공 시 `session.regenerate()` 없음(세션 고정), 시도 횟수 제한 없음. `secure` 쿠키가 OPTIONAL인 `NODE_ENV === 'production'`에 의존 | 보안(낮음) | D(#10과 같이) |
| N4 | 게시글 생성 시 `mainCategoryId`·`subCategoryId`가 실제 존재하는지, 서브의 `parentId`가 메인과 맞는지 확인하지 않음 | 데이터 정합성 | A |
| N5 | e2e `posts.e2e-spec.ts:226-231,237-242`의 카테고리 단언이 `forEach`라 결과가 비면 통과 — 실질적으로 빈 테스트 | 테스트 공백 | A(e2e는 실행 금지이므로 수정만) |
| N6 | `findOne`이 조회수 증가 **전** 문서를 응답 → `viewCount`가 1 작게 나감 | 버그(낮음) | E(#17 헬퍼 정리 때) |
| N7 | `x-viewed` 헤더가 Swagger에 문서화되지 않음(`@ApiHeader` 없음). 틀린 JSDoc(#30(b))이 유일한 설명 | 문서 | C |
| N8 | `ParseObjectIdPipe`도 오류 메시지에 입력값을 넣는다(`Invalid ObjectId: '…'`), 반환 타입은 `Types.ObjectId` | #6 구현 주의 | A |
| N9 | 검색 클라이언트가 응답 본문을 소비하지 않음, `MockAuthModule`의 `InternalApiClient` provider 중복, `AuthModule`의 정적 `PassportModule` import 무의미, 카테고리 스키마에도 `group` enum 없음 | 유지보수 | D·E·A |

### 1-4. 프런트(`vans_story`) 계약 확인

- 게시글 DELETE를 호출하는 코드 없음 → #7(b) `@HttpCode(204)` 변경은 프런트 영향 없음
- 목록은 `limit=10`만 사용(`lib/posts/client-actions.ts:45`, 카테고리 페이지들) → `@Max(50)` 안전
- `x-viewed`는 `hasViewed ? 'true' : 'false'`(`client-actions.ts:93`) → 코드가 맞고 JSDoc이 틀림(#30(b) 확정)
- `createdAt`·`updatedAt`·`subCategory`를 받은 문자열 그대로 화면에 출력(`ViewPostContent.tsx:12-17`) → #9 날짜 형식 변경과 #17 응답 필드 통일은 **화면이 바뀐다**(G·E에서 프런트 확인 필요)

---

## 2. 구현 계획

감사 문서 3절의 묶음 A~G를 유지하되, 위 정정으로 **B를 A 앞으로** 올린다(TODO의 "최우선"이고 선행 조건이 풀렸다). 각 묶음은 main에서 브랜치를 따고, 커밋마다 `tsc` → `npm test` → (구조 변경 시) `npm run build`.

### 0단계 — 환경 (사용자 작업)

- ~~이 PC에 Node 26 설치~~ (2026-10-22 완료, 26.12.1)
- 운영 DB 읽기 전용 확인(B·A 착수 전에 있으면 좋음): `posts.subCategoryId` 중 `categories`에 없는 id 개수, `posts.mainCategoryId`도 동일

### 1. B. 권한 — `fix/authorization` (결정 불필요)

| 커밋 | 내용 | 테스트 |
|---|---|---|
| B1 | `src/.../role.enum.ts`(`Role.Admin='admin'`, `Role.User='user'`). `JwtStrategy.validate`에서 `auth`를 쉼표 분리 → `ROLE_` 접두사 제거 → 소문자 → `request.user = { sub, roles: Role[] }`. `algorithms: ['HS512']`(N2). JSDoc 반환 설명 수정(#30(c)) | Strategy 단위 테스트 신규: `ROLE_ADMIN`, `ADMIN`, `ROLE_USER,ROLE_ADMIN`, 빈 값 |
| B2 | `RolesGuard`를 `roles.some(...)`로, 메타데이터 없으면 통과. 게시글 생성·삭제(`@Roles(Role.Admin)`)와 **카테고리 쓰기 5개**에 `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.Admin)`. `AuthModule`의 `Reflector` provider 제거(#14 일부) | RolesGuard 단위 테스트, bootstrap 테스트에 403 케이스 |
| B3 | `PostsService.update`: 파라미터 필수, `roles`가 비면 `ForbiddenException`(fail-closed), 관리자 판정을 `roles.includes(Role.Admin)`로(#3) | `service.spec.ts:508` "backward compatibility"를 거부 케이스로 교체, 관리자 예외 동작 케이스 추가. `TestAuthGuard` 픽스처를 `roles: [Role.Admin]`으로 |

배포 영향: 지금까지 일반 사용자가 호출할 수 있던 게시글 생성·삭제·카테고리 쓰기가 막힌다(의도된 변경). 관리자는 오히려 남의 글 수정이 처음으로 가능해진다. 프런트에서 일반 사용자에게 이 버튼이 보이는지 확인.

후속(레포 간): N1 — Spring `JwtProvider.generateToken`에 `typ`(`access`/`refresh`) 클레임 추가·배포 → 이 서비스가 `typ !== 'access'` 거부. 순서를 지키지 않으면 모든 요청이 401. 별도 브랜치·별도 PR.

### 2. A. 데이터·검증 버그 — `fix/data-validation` (결정 불필요)

| 커밋 | 내용 | 테스트 |
|---|---|---|
| A1 | #1 `subCategoryId`에 `ref: 'Category'` + 주석 수정 | `PostSchema.path('subCategoryId').options.ref === 'Category'` |
| A2 | #5 필수 문자열에 `@IsNotEmpty()`(post create, category create). update DTO에도 같은 검증(`@IsOptional()` + `@IsNotEmpty()`), 두 `findByIdAndUpdate`에 `runValidators: true` | `MockGenerator` 기반 DTO 검증 테스트: `''`·`null` 거부 |
| A3 | #6 두 컨트롤러 `:id`에 `ParseObjectIdPipe`, 서비스 `isValid` 5곳 제거, 핸들러 파라미터 타입 정리(N8 — 입력값이 메시지에 반사되므로 필요하면 `exceptionFactory`가 있는 자체 파이프) | 서비스의 `INVALID_ID` 5케이스 삭제, bootstrap 테스트에 400 케이스. e2e `:209,215` 기대값 404→400(수정만, 실행 금지) |
| A4 | #4 `PaginationQueryDto`(`page`, `limit` `@Type(() => Number) @IsInt() @Min(1)`, `limit @Max(50)`, `mainCategory`, `subCategory`) | 컨트롤러 파싱 테스트 또는 bootstrap 400 케이스 |
| A5 | #19 `CategoryGroup` enum + DTO `@IsEnum` + 스키마 `enum`(N9). N4 생성 시 카테고리 존재·부모 일치 확인(`BadRequestException`) | 각각 정상·예외 |

배포 후: 검색 인덱스 재색인(#1). A1은 0단계의 고아 id가 0이 아니면 배포 보류.

### 3. C. Swagger·문서 정확성 — `docs/swagger-contract` (결정 불필요)

- C1 데코레이터: `@ApiBearerAuth('Authorization')` → `@ApiBearerAuth()`(#7(a)), DELETE 두 곳 `@HttpCode(HttpStatus.NO_CONTENT)`(#7(b), 프런트 영향 없음 확인), `ApiPaginatedResponse` 데코레이터(#7(c)), `thumbnail` `@ApiPropertyOptional`(#7(d)), `x-viewed` `@ApiHeader`(N7), `@ApiTags('posts')`
- C2 #8 `scripts/generate-swagger-spec`: `withFakeMongoose`로 DB 없이 `SwaggerModule.createDocument` → `swagger-spec.json`. `generate-swagger-clean.js`가 스펙 읽기 실패 시 exit 1(현재 0으로 조용히 성공)
- C3 #30 JSDoc: (b) `x-viewed` 반대 설명, (d) 서브 카테고리 옛 설명, (a) JSDoc 안의 JSON 예시 삭제, (e) `@module`. CLAUDE.md 함정 7 문장 수정
- 테스트: bootstrap의 Swagger 테스트에 security 이름 일치·DELETE 204 검사

### 4. D. 설정·파이프라인·로깅 — `refactor/pipeline` (결정 9·10·14 필요)

- #12·#26 클라이언트: 실패 시 `Logger.warn`, `res.ok` 확인(두 메서드), 키는 생성자 `getOrThrow`, Logger 이름 `SearchIndexClient.name`, 응답 본문 소비. PostsService의 도달 불가 `.catch(console.error)` 3곳 정리. `fetch` 모킹 단위 테스트
- #11 `encodeURIComponent(email)`
- #21 `NestExpressApplication` + `useBodyParser('json'|'urlencoded', { limit: '10mb' })`
- #27 `main.ts` 정리(logger 옵션 생략, import 합치기, `void bootstrap()`), #14 나머지 exports·`HttpModule`·정적 `PassportModule`
- 결정 후: #20 `APP_PIPE`(결정 9), #22 함수형 미들웨어 + `SessionData` 선언 병합(결정 10), #10·N3 `SESSION_SECRET`·`trust proxy`·`timingSafeEqual`·`regenerate()`(결정 14 — **CloudType 환경 변수 추가가 배포보다 먼저**)

### 5. E. 죽은 코드·중복 — `refactor/cleanup` (결정 8·13 필요)

- #16 결정 불필요분: `config/*`, `pagination/DTO/dto.ts`, `PostInitService`, `MockAuthModule` 잔여물, `package.json`의 `swagger:serve`·`swagger:open`·`migrate:*`
- #16 미사용 조회 메서드 3개(결정 13)
- #17 `findPopulatedById`·`toResponse`·`toIndexPayload` 헬퍼, N6 조회수 응답. 응답 필드가 통일되면 `findOne`에 `subCategory`가 처음 실리므로 프런트 화면 확인
- #18 `UpdatePostDto extends PartialType(CreatePostDto)` — A2의 update 검증은 이걸로 자동 승계되므로 **A2와 순서를 맞추면 중복 작업이 준다**(A2를 이 방식으로 해도 됨)
- #15 `CategoryModule`이 `MongooseModule` export(`findAll`이 Category 모델을 계속 쓰므로 #16 이후에도 필요)
- #13 `JwtService` 주입 제거(결정 8)

### 6. F. 명명·구조 — `refactor/nest-naming` (결정 6·11은 `docs/conventions.md`로 확정)

감사 문서 3절 F의 커밋 순서 그대로. 목표 경로는 감사 문서 2절(`src/modules/posts/…`)이 아니라 **`docs/conventions.md` 1절**(`src/posts/…`, 외부 연동 모듈 분리, 테스트 colocate) — 리네임 목록의 표준 경로 열을 그에 맞춰 다시 쓴다. 2절 표 행별 숫자는 검증으로 맞음, 합계만 53. #24 `@CurrentUser()`는 B1에서 `request.user` 타입이 정해진 뒤가 자연스럽다.

### 7. G. 계약 변경 (결정 5·7 필요)

#9·#29·#35·#7(e)·#23. 날짜 문자열이 화면에 그대로 나가므로 프런트와 같은 배포. 미추적 `Dockerfile`(`node:24-alpine`, TZ·LANG 없음)로 배포 중이라면 지금도 en-US/UTC 형식일 수 있어, 결정 5 전에 운영 응답의 `createdAt` 한 건을 확인한다.

### 결정 대기 → 막히는 묶음

| TODO 결정 | 막는 것 |
|---|---|
| 5 직렬화·날짜·id | G |
| ~~6 폴더 구조, 11 테스트 위치~~ (컨벤션 문서로 확정) | — |
| 7 prefix·버전 | G(#23) |
| 8 `JwtModule` 존치 | E(#13) |
| 14 `SESSION_SECRET` (9·10은 컨벤션 문서로 확정) | D 일부 |
| 12 툴체인 | 없음(보류 추천) |
| 13 미사용 조회 메서드 | E(#16 일부) |

B·A·C와 D의 결정 불필요분은 지금 바로 착수할 수 있다.
