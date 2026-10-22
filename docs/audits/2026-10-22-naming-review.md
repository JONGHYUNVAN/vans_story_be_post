# 명명 전수 검토와 수정 계획 (2026-10-22)

`refactor/naming` 브랜치(`fix/data-validation` 위, 기준 커밋 `676cc5d`)에서 `src/`·`test/`·`scripts/`·`package.json`의 모든 이름을 검토했다. 기준은 `docs/conventions.md` 1·2절과 NestJS·TypeScript·Jest 관례. 이 문서는 스냅샷이고, 확정된 규칙은 `conventions.md` 2절에 옮긴다.

판정 기준 세 가지: **일관성**(같은 개념을 같은 이름으로), **역할**(이름이 하는 일·반환값과 맞음), **관례**(Nest CLI 출력·공식 문서·TS 표기).

---

## 1. 통일 규칙 (conventions 2절에 추가)

| # | 규칙 | 지금 어긋난 예 |
|---|---|---|
| R1 | 사람: 요청자는 `userEmail`·`userRoles`, 게시글 소유자 필드와 그것으로 조회하는 인자는 `authorEmail`. `request.user`는 `{ email, roles }` (JWT 클레임 `sub`는 전략에서만) | `AuthenticatedUser.sub`, `getUserNickname(email)` |
| R2 | 카테고리: id는 `…CategoryId`, value 문자열은 `…CategoryValue`, 조회한 문서는 `mainCategory`/`subCategory`. 축약 금지 | `cat`, `subCat`, `main`, `sub`, 메인 문서를 `category` |
| R3 | DTO 클래스는 정식 이름만(`CreatePostDto`), 변수는 `create<Resource>Dto`/`update<Resource>Dto`, 서비스 안 응답 변수는 `<resource>Response(s)`, 문서→응답 변환 private 메서드는 `toResponseDto` | 별칭 `CreateDto/UpdateDto/ResponseDto`, `createDto`, `responseDto`, `result`, `postsWithAuthor`, `enrichPostWithCategoryInfo` |
| R4 | 모듈·컨트롤러·서비스는 복수형 리소스(`CategoriesService`), 스키마·enum은 단수 | `CategoryService/Controller/Module` |
| R5 | 외부 HTTP 연동은 환경 변수 이름을 따라 `<Name>ServiceClient`(`USER_SERVICE_URL` → `UserServiceClient`, `SEARCH_SERVICE_URL` → `SearchServiceClient`). 주입 필드는 클래스 이름 camelCase | `InternalApiClient`, `apiClient`, `SearchIndexClient`, `searchIndex` |
| R6 | 메서드 동사: 조회 `find*`, 서비스 삭제 `remove`, 동사+대상 순서. 부수 효과는 이름에 드러낸다 | `findByGroup`(실제는 전체를 묶음), `indexPost`/`deletePostIndex`(어순 불일치) |
| R7 | `ConfigService` 주입 이름은 `configService`. `config`는 원시 env 레코드와 `DocumentBuilder` 결과에만 | `config: ConfigService` 6곳 |
| R8 | boolean은 `is/has/should`, 모듈 수준 상수(메타데이터 키·기본값·픽스처 포함)는 `UPPER_SNAKE`. 상수 모음은 `<feature>.constants.ts` | `viewed`, 리터럴 `'fields'`·`10`, `REQUIRED`, `OBJECT_ID`, `mainCategoryDoc` |
| R9 | 일반 명사(`result`, `data`, `bad`, `expected`, `controller`, `err`, `m`) 대신 도메인 이름. `catch`는 `error` | 서비스·클라이언트·테스트 곳곳 |
| R10 | JSDoc `@module` 태그를 쓰지 않는다(typedoc `expand`가 경로로 이름을 붙인다) | 28곳, 경로와 불일치·`dto/index` 중복 |
| R11 | 테스트 더블: jest.fn 객체 팩토리는 `createMock<토큰 클래스>()` + 변수 `mock<토큰 클래스>`, 손으로 짠 동작 구현은 `Fake<대상>`. `TestingModule`은 `moduleRef` | `TestAuthGuard`, `MockInternalApiClient`, `mockQuery`, `createMockApiClient`, `mockSearchIndex`, `module`, `moduleFixture` |
| R12 | 테스트 제목: 최상위 describe는 대상 심볼, it은 한국어 "조건 + 결과"(상태 코드는 숫자, `테스트`·`- 에러`·`- 성공` 접미사 없음) | 영어 it 37개, e2e 제목 |
| R13 | Swagger 태그는 리소스 이름(`posts`, `categories`), 보안 스킴은 `@ApiBearerAuth()` | `'api/v1/posts'`, `@ApiBearerAuth('Authorization')`(문서에 없는 스킴 — 버그) |

## 2. 파일·폴더 (conventions 1절 목표, 이번에 보완한 곳은 ★)

| 현재 | 목표 |
|---|---|
| `src/modules/post/Controller/controller.ts`, `Service/service.ts`, `Module/module.ts` | `src/posts/posts.controller.ts`, `posts.service.ts`, `posts.module.ts` |
| `src/modules/post/DTO/*`, `schemas/*` | `src/posts/dto/*`, `src/posts/schemas/*` (`create-post.dto.spec.ts`에서 ★`update-post.dto.spec.ts` 분리) |
| `MAX_POSTS_PER_PAGE`(DTO 파일), 기본값 리터럴 `10` 3곳 | ★`src/posts/posts.constants.ts` (`MAX_POSTS_PER_PAGE`, `DEFAULT_POSTS_PER_PAGE`) |
| `src/modules/category/{controller,service,module}/category.*.ts` | `src/categories/categories.{controller,service,module}.ts` |
| `src/modules/category/{dto,schemas}/*`, `category-group.enum.ts` | `src/categories/{dto,schemas}/*`, `src/categories/category-group.enum.ts` |
| `src/utils/Authorization/Module/module.ts`, `Guard/auth.ts`, `Guard/role.ts`, `Guard/roles.decorator.ts`, `Strategy/strategy.ts`, `role.enum.ts` | `src/auth/auth.module.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`, `roles.decorator.ts`, `jwt.strategy.ts`, `role.enum.ts` |
| `src/utils/Authorization/authenticated-user.interface.ts` | `src/auth/interfaces/authenticated-user.interface.ts` |
| `src/utils/Api/api.ts` (`PostsModule`이 직접 provide) | `src/user-service/user-service.client.ts` + ★`user-service.module.ts` |
| `src/utils/Api/search-index.client.ts` | ★`src/search-service/search-service.client.ts` + `search-service.module.ts` (R5 — conventions 1절의 `search-index/`를 고친다) |
| `src/utils/Mapper/mapper.ts`, `fieldname.extractor.ts` | ★`src/common/serialization/map-to-dto.ts`, `response-field.decorator.ts` (결정 5에서 class-transformer로 가면 삭제) |
| `src/utils/types/pagination.ts` | `src/common/interfaces/paginated.interface.ts` |
| `src/swagger/middleware/swagger.auth.middleware.ts` | `src/swagger/swagger-auth.middleware.ts` + ★`swagger.constants.ts`(`SWAGGER_PATH`) |
| 단위 spec (`test/post/Service/service.spec.ts`, `test/config/env.validation.spec.ts`, src 안 `role.spec.ts`·`strategy.spec.ts`) | 대상 옆: `src/posts/posts.service.spec.ts`, `src/config/env.validation.spec.ts`, `src/auth/roles.guard.spec.ts`, `src/auth/jwt.strategy.spec.ts` |
| `test/post/e2e/posts.e2e-spec.ts` | `test/posts.e2e-spec.ts` |
| `test/app/env.ts` | `test/app/dummy-env.ts` (부수 효과 import) |
| `test/helpers/test-auth.guard.ts`, `mock-api.client.ts`, `mock-generator.ts`, `test-utils.ts` | `fake-jwt-auth.guard.ts`, `fake-user-service.client.ts`, `dto-fixtures.ts`, `post-fixtures.ts` |
| 삭제(쓰는 곳 없음, 결정 불필요 — 감사 #16): `src/config/{cors,database,swagger}.ts`, `src/utils/pagination/DTO/dto.ts`, `src/database/init/post.init.ts`(빈 시드, 기동마다 `console.log`), `test/helpers/mock.module.ts`(export 없음 — e2e가 이미 override), `MockGenerator`의 `ResponseDto`·일반 분기 | — |

경로 별칭 ★`test/*`를 tsconfig `paths`와 jest(`package.json`, `test/jest-e2e.json`) `moduleNameMapper`에 추가한다 — `src/**/*.spec.ts`가 `test/helpers`를 쓰기 위해. 이동 후 `forceConsistentCasingInFileNames: true`.

## 3. 식별자

### 운영 코드

| 위치(현재) | 현재 | 변경 |
|---|---|---|
| post `DTO/index.ts` | 별칭 `CreateDto`·`UpdateDto`·`ResponseDto` | 삭제, 정식 이름만 (src 55·test 39 참조) |
| post controller·service | `createDto`, `updateDto` | `createPostDto`, `updatePostDto` |
| post controller | `query`, `viewed?: string` | `queryDto`, `viewedHeader` |
| post service | `apiClient`, `searchIndex` | `userServiceClient`, `searchServiceClient` |
| post service | `enrichPostWithCategoryInfo(post: any)` | `toResponseDto` |
| post service | `findOne(id, viewed)` | `findOne(id, hasViewed)` |
| post service | `created`·`populated`·`result`(create), `result`(incrementViewCount)·`updated`(update)·`result`(remove) | `createdPost`·`populatedPost`·`postResponse`, `updatedPost`·`updatedPost`·`deletedPost` |
| post service | `responseDto`, `postsWithAuthor` | `postResponse`, `postResponses` |
| post service | `authorNicknameForIndex` | 삭제(`postResponse.author`가 이미 `'Unknown'` 처리) |
| post service | `indexPayload`·`updateIndexPayload` | `searchIndexPayload` |
| post service | `query: any`(목록 필터) | `filter: FilterQuery<Post>` |
| post service | `category`·`subCat`·`cat`, `main`·`sub`, `total` | `mainCategory`·`subCategory`, `mainCategory`·`subCategory`, `totalItems` |
| post service | `err` | `error` |
| post `find-posts-query.dto.ts` | `MAX_POSTS_PER_PAGE`, 리터럴 `10` | `posts.constants.ts`의 `MAX_POSTS_PER_PAGE`·`DEFAULT_POSTS_PER_PAGE` |
| category 전체 | `CategoryController/Service/Module`, 필드 `categoryService` | `CategoriesController/Service/Module`, `categoriesService` |
| category service | `findByGroup`(컨트롤러도) | `findAllGrouped` |
| category service | `existingCategory`(중복 검사), `createdCategory`(save 전), `result`(remove) | `duplicateCategory`, `category`, `deletedCategory` |
| category service | `'Etc'` 리터럴, `Record<string, …>` | `CategoryGroup.Etc`, `Partial<Record<CategoryGroup, …>>` |
| `AuthenticatedUser` | `sub` | `email` |
| `JwtAuthGuard.handleRequest` | `errorType` | `errorName` (`info.name`) |
| `InternalApiClient` | 클래스, `getUserNickname(email)`, `apiKey`, `{ data }`→`data.data` | `UserServiceClient`, `getNicknameByEmail(email)`, `internalApiKey`, `{ data: body }`→`body.data` |
| `SearchIndexClient` | 클래스, `indexPost`/`deletePostIndex`, `new Logger('SearchIndex')`, `controller`, `err` | `SearchServiceClient`, `indexPost`/`removePostFromIndex`, `new Logger(SearchServiceClient.name)`, `abortController`, `error` |
| 6곳 | `config: ConfigService` | `configService: ConfigService` |
| `env.validation.ts` | `REQUIRED`/`OPTIONAL`, `bad`·`cors`·`read` | `REQUIRED_ENV`/`OPTIONAL_ENV`, `invalidOrigins`·`corsOrigins`·`readTrimmed` |
| `parse-object-id.pipe.ts` | `OBJECT_ID` | `OBJECT_ID_PATTERN` |
| Mapper | `Field`, 리터럴 `'fields'`, 제네릭 `<Entity, Dto>` | `ResponseField`, `RESPONSE_FIELDS_KEY`, `<TEntity, TDto>` |
| swagger 미들웨어 | `expected`, `htmlPath`, 경로 문자열 4번 반복 | `adminPassword`, `loginPagePath`, `SWAGGER_PATH` |
| 컨트롤러 2개, `main.ts` | `@ApiTags('api/v1/…')`·`addTag('api/v1/posts')`, `@ApiBearerAuth('Authorization')` | `@ApiTags('posts'/'categories')`, `@ApiBearerAuth()` |
| 전체 | `@module` 태그 28곳 | 삭제 |

### 테스트

| 현재 | 변경 |
|---|---|
| `TestAuthGuard extends AuthGuard('jwt')`(passport 안 씀, `handleRequest` 죽은 코드) | `FakeJwtAuthGuard implements CanActivate` |
| `MockInternalApiClient`, `mockNicknames` | `FakeUserServiceClient`, `nicknamesByEmail` |
| `MockGenerator.createMock(…)` | 함수 `createValidDto(dtoClass, overrides)` |
| `mockQuery`, `type MockQuery`(미사용) | `createMockQuery`, 삭제 |
| `createMockApiClient`/`mockApiClient`, `mockSearchIndex` | `createMockUserServiceClient`/`mockUserServiceClient`, `createMockSearchServiceClient`/`mockSearchServiceClient` |
| `createPostDocument`, `CategoryFixture`, `PostResponse` 타입 | `createPostLeanDoc`, `CategoryLeanDoc`, `PopulatedPostResponse` |
| `mainCategoryDoc`·`subCategoryDoc`·`populatedMainCategory`·`populatedSubCategory` | `MAIN_CATEGORY_DOC`·`SUB_CATEGORY_DOC`·`POPULATED_MAIN_CATEGORY`·`POPULATED_SUB_CATEGORY` |
| `expectedEnrichedResponse` | `expectedFullResponse` (`toResponseDto` 경로 — 카테고리 label·sub까지 채움) |
| `'Bearer test_token'`(관리자) / `testToken`, sub `test@example.com`(단위 테스트에서는 작성자) | `'Bearer admin_token'` / `adminToken`, `admin@example.com` |
| `module`, `moduleFixture` | `moduleRef` |
| bootstrap `token()`, `remove` spy | `signSpringToken()`, `removeSpy` |
| config.spec `KEYS`·`SECRET`·`Loaded`·`loadFresh`·`compile`·`m` | `ENV_KEYS`·`JWT_SECRET_RAW`·`FreshModules`·`loadFreshModules`·`compileAppModule`·`fresh` |
| env.validation.spec `VALID` | `VALID_ENV` |
| `withFakeMongoose(builder, model)` | 인자 `fakeModel` |
| e2e `updateDto: CreateDto = createMock(CreateDto)` 3곳 | `UpdatePostDto` |
| DTO spec `failedFields(dto, …)`, query spec `parse` | `dtoClass`, `validateQuery` |
| 영어 it 37개, e2e 제목(결과 없음·`- 에러`·"검색"이 실제로는 목록 필터) | R12 |
| bootstrap `'ObjectId가 아니면 DB 조회 없이 400'` — DB 미조회를 확인하지 않고, 12자 케이스는 엉뚱한 문자열을 찾음 | 제목을 단언에 맞추고 각 케이스의 입력값으로 확인 |

### 스크립트

| 현재 | 변경 |
|---|---|
| `swagger:generate:clean`, `swagger:build:clean`, `scripts/generate-swagger-clean.js`(`clean`은 "Try it out 없는 HTML"이라는 뜻) | `swagger:html`, (`build:clean` 삭제 — 빌드 결과를 쓰지 않는다, 감사 #8), `scripts/generate-swagger-html.js` |
| `docs` | `docs:typedoc` |
| `swagger:serve`·`swagger:open`·`migrate:*` | 삭제(의존성·파일 없음, 감사 #16) |
| `start*`·`test:e2e`·`test:all*` | **유지** — `.claude/settings.json` deny 패턴이 이 이름에 걸려 있다 |

## 4. 이번에 바꾸지 않는 것

- **API 계약**(묶음 G, 결정 5·7): 응답·쿼리의 `mainCategory`/`subCategory`(실제 값은 value), 응답 `author`(닉네임), `_id` vs `id`, `SearchIndexPayload.post_id`, 오류 코드(`NO_AUTH_HEADER`…), `CategoryGroup` 값(대문자 시작 — 프런트·DB 값), `iconName`/`color`, 경로·헤더·env 이름. conventions 2절의 "enum 값은 소문자"는 `Role`에만 적용한다고 명시한다
- **결정 13 보류**: `findByAuthor`(→ 남기면 `findByAuthorEmail`), `searchPosts`(→ `findByKeyword`), `findByThemeAndCategory`(→ `findByCategoryValues`) — 삭제(추천)인지 남길지 정해질 때까지 이름 그대로 이동만. 그 테스트도 마찬가지
- **묶음 D**: Swagger 세션 타입(`CustomSession`/`CustomRequest` → `SessionData` 선언 병합), 세션 키 `swaggerAuthorized`, 미들웨어 함수화, `JwtAuthGuard`의 미사용 `JwtService`(결정 8)
- **묶음 C**: 컨트롤러 JSDoc의 옛 `theme`/`category` 예시(삭제 예정)
- `.gitattributes`·CRLF 정리(TODO 결정 2)

## 5. 작업 순서 (커밋)

1. 죽은 파일·스크립트 삭제
2. 파일·폴더 이동 + import 경로 갱신 + 외부 연동 모듈 2개 + `test/*` 별칭 + `forceConsistentCasingInFileNames` (git이 rename으로 추적하도록 내용 변경은 import만)
3. 운영 코드 식별자 (클래스·메서드·필드·변수·상수, `@module` 삭제, Swagger 태그·스킴)
4. 테스트 식별자·제목
5. 문서 (`conventions.md` 2절 규칙 R1~R13과 1절 트리, CLAUDE.md, `.claude/rules`·스킬 경로, architecture, TODO)

커밋마다 `tsc`·`npm test`, 2·3에서 `npm run build`.

## 6. 재검토 (계획 확정 전)

- 새 이름 충돌: `ResponseField`, `UserServiceClient`, `SearchServiceClient`, `CategoriesService`, `createValidDto`, `FakeJwtAuthGuard`, `SWAGGER_PATH`, `posts.constants`가 src·test에 없다(grep). `ResponseField`는 `@nestjs/graphql`의 `Field`와도 겹치지 않는다
- 경로 문자열: `config.spec.ts`의 `require('src/app.module')`은 그대로, `require('../helpers/fake-mongoose')`는 갱신 대상. Swagger 미들웨어의 `path.join(__dirname, '..', 'views', …)`는 이동 후 `'views'`로(빌드 결과 `dist/swagger/views`). `nest-cli.json` assets(`swagger/views/**`)는 그대로
- `tsconfig.build.json`이 `test`와 `**/*spec.ts`를 빼므로 src로 옮긴 spec과 `test/*` 별칭은 빌드에 들어가지 않는다
- `jest-e2e.json`의 `rootDir`는 `test/`라 `test/posts.e2e-spec.ts`도 잡히고, `^test/` 매핑은 `<rootDir>/$1`
- 계획 안의 모순 하나 수정: 결정 13 보류 메서드(`findByAuthor`)를 3절에서 바꾸려 했던 것을 뺐다
- 문서 경로 참조 11곳(README·CLAUDE.md·.claude·architecture·conventions)은 5단계에서 같이 고친다
