# NestJS·TypeScript 표준 준수 전수조사 (2026-10-22)

조사 시점의 스냅샷이다. 고칠 항목과 진행 상황은 `TODO.md` 3절("표준 준수 전수조사" 묶음)에서 관리하고, 이 문서는 근거·위치·결정 배경을 남기기 위해 고치지 않는다.
범위: `src/`, `test/`, `scripts/`, 루트 설정 파일. "표준"은 docs.nestjs.com, Nest CLI 스캐폴딩(`nest new`/`nest g`) 결과, TypeScript 관례다. 근거가 문서에 없으면 "관례"로 구분했다.

- 기준 커밋: `5134a0b`(PR #2 `refactor/config-service`의 마지막 커밋, main 병합 커밋 `ff0d4d8`). 아래 `file:line`은 이 커밋 기준
- 확인 실행: `npx tsc --noEmit` 통과, `npm test` 4 스위트 / 47건 통과(Node 26.8.1), `npm run build` 통과(`src/...` import가 dist에서 상대경로로 재작성됨, `swagger/views` 에셋 복사됨)
- 기준선: 레포 밖 스크래치패드에서 Nest CLI 12.0.10으로 `nest new` + `nest g resource posts`, `nest g guard auth/jwt-auth --flat`, `nest g middleware`, `nest g decorator` 실행 결과와 비교
- 직접 검증: mongoose 7.8.12 소스(`helpers/populate/getModelsMapForPopulate.js:336-343`, `queryhelpers.js:36`)와 레포 밖 probe 스크립트(빈 문자열 `required` 검증)
- 공식 문서 확인: docs.nestjs.com `faq/raw-body`, `techniques/mongodb`, `middleware`, `openapi/security`, `guards`, `security/authorization`(Nest 12에서 RBAC 예제가 `guards` 페이지로 옮겨짐)

판정 표기: **확인** = 코드·소스·실행으로 확인 / **추정** = 배포 환경이나 데이터를 봐야 확정

---

## 1. 위반 표 (영향 큰 순)

| # | 분류 | 위치(file:line) | 현재 | 표준 | 근거 | 영향 | 난이도 | 제안 |
|---|---|---|---|---|---|---|---|---|
| 1 | 데이터 계층 | `src/modules/post/schemas/post.schema.ts:82`; 쓰는 곳 `Service/service.ts:40-41,81,101,191,398` | `subCategoryId`에 `ref`가 없다. mongoose 쿼리 populate는 `_localModel`이 있으면 ref 없는 경로를 **건너뛴다** → `subCategory`/`subCategoryLabel`은 항상 `''`, 검색 인덱스에 `subCategory: ''`, 응답 `subCategoryId`는 원시 ObjectId. 단위 테스트는 populate된 픽스처를 넣어 이 버그를 가린다. 주석 "Category.subCategories._id 참조"는 마이그레이션 전 내용 | `@Prop({ type: Types.ObjectId, ref: 'Category' })` | techniques/mongodb 스키마 절의 `ref` 예제(`@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })`); mongoose 소스 `getModelsMapForPopulate.js:336-343` (**확인**) | 버그 | S | `ref: 'Category'` 추가 + 주석 수정. 스키마 단위 테스트(`PostSchema.path('subCategoryId').options.ref`)로 재발 방지. 프런트에 서브 카테고리가 처음으로 내려가고 검색 인덱스 재색인 필요 |
| 2 | 보안 | `src/modules/category/controller/category.controller.ts:58-59,202-203,244-245,278-279,313-314`; `src/modules/post/Controller/controller.ts:127-128,484-485`; `src/utils/Authorization/Module/module.ts:31` | `RolesGuard` 미등록이라 `@Roles('admin')` 무효(TODO 있음). **추가 발견**: 카테고리 생성·수정·삭제·활성화는 `@Roles`조차 없어 로그인한 아무 사용자나 호출 가능(Swagger 설명은 "관리자 권한 필요") | `@UseGuards(JwtAuthGuard, RolesGuard)` 또는 `APP_GUARD` | guards "Role-based authentication", "Binding guards" | 보안 | M | **TODO 있음** — 해당 항목 범위를 카테고리 쓰기 엔드포인트 5개까지 넓힌다 |
| 3 | 보안 | `src/modules/post/Service/service.ts:358,369`; 이 동작을 고정한 테스트 `test/post/Service/service.spec.ts:508` | `if (userEmail && userRole && userRole !== 'admin' && …)` — `role`(JWT `auth` 클레임)이 없으면 권한 검사를 **통과**(fail-open). 파라미터도 optional | 권한 정보가 없으면 거부(fail-closed) | 관례(OWASP fail-safe defaults) | 보안 (**추정**: Spring 토큰에 `auth`가 빠지는 경우가 있는지에 달림) | S | 파라미터를 필수로, role 없으면 `ForbiddenException`. "backward compatibility" 테스트를 거부 케이스로 교체. TODO 보안 항목 (4)와 같은 커밋 |
| 4 | 보안·DTO | `src/modules/post/Controller/controller.ts:196-206`; `Service/service.ts:136-142` | `page`/`limit`을 `string`으로 받아 `parseInt`. 상한 없음 → `?limit=100000`이면 게시글 10만 건 + 사용자 서비스 호출 10만 번. `?page=abc`는 `NaN`이 `< 1` 검사를 통과해 `skip(NaN)`으로 감 | Query DTO(`@Type(() => Number) @IsInt() @Min(1) @Max(50)`) 또는 `DefaultValuePipe` + `ParseIntPipe` | pipes "Built-in pipes", "Providing defaults" | 보안(DoS)·버그(NaN은 **추정**) | S | `PaginationQueryDto`(+`mainCategory`, `subCategory`)로 받기. 전역 `ValidationPipe`가 이미 있어 데코레이터만 추가하면 된다 |
| 5 | DTO·검증 | `create-post.dto.ts:51,67,83`, `update-post.dto.ts:56,74,91`; `create-category.dto.ts:53,63,106` | `@IsString()`만 있어 `''`이 통과 → 스키마 `required: true`가 빈 문자열을 거부 → mongoose `ValidationError` → **500** | `@IsNotEmpty()`(또는 `@MinLength(1)`)로 400 | class-validator 데코레이터; mongoose 빈 문자열 required 동작 probe로 **확인** | 버그 | S | 필수 문자열 필드에 `@IsNotEmpty()`. `title`은 이미 `@MinLength(1)` |
| 6 | 예외 | `src/modules/category/service/category.service.ts:100,149,167` (findOne/update/remove/activate/deactivate); `src/modules/post/Service/service.ts:236-237` 외 4곳 | 카테고리: 형식이 틀린 `:id`가 `CastError` → **500**. 게시글: 형식 오류를 **404** `Invalid post ID: …`로 응답(입력값 반사) | 경로 파라미터 단계에서 400 — `@Param('id', ParseObjectIdPipe)` | `@nestjs/mongoose` 12가 `ParseObjectIdPipe`/`IsObjectIdPipe` export(설치 패키지 확인). techniques/mongodb에는 절이 없음 → 패키지 API·관례 | 버그 | S | 두 컨트롤러에 파이프 적용, 서비스의 `isValid` 검사 제거. e2e `posts.e2e-spec.ts:209`(404 기대)는 400으로 바뀜 — 응답 계약 변경 |
| 7 | Swagger | (a) `controller.ts:129,364,440,486` vs `main.ts:73` (b) `controller.ts:481`, `category.controller.ts:257` (c) `controller.ts:190` (d) `create-post.dto.ts:71` (e) `post-response.dto.ts:44-58` (`test/helpers/test-utils.ts:140`이 불일치를 인정) | (a) 게시글은 `@ApiBearerAuth('Authorization')`인데 문서에는 `bearer` 스킴만 등록 → Swagger UI가 게시글 API에 토큰을 안 붙임(`swagger-spec.json`에서 **확인**). 카테고리는 `@ApiBearerAuth()`라 정상 (b) DELETE를 204로 문서화했지만 `@HttpCode(204)`가 없어 실제 200 (c) 목록 응답을 `ResponseDto[]`로 선언, 실제는 `{ data, meta }` (d) 선택 필드 `thumbnail`이 `@ApiProperty` → 필수로 표시 (e) `mainCategoryId`/`subCategoryId`를 ObjectId로 선언했지만 populate된 객체가 나감 | (a) 스킴 이름 일치 (b) `@HttpCode(HttpStatus.NO_CONTENT)` (c) `ApiExtraModels` + `getSchemaPath` 제네릭 응답 (d) `@ApiPropertyOptional` (e) 실제 형태로 선언하거나 id만 내보냄 | openapi/security; openapi/operations "Advanced: Generic ApiResponse"; controllers "Status code" | 버그(문서·계약) | S–M | (a)(b)(d)는 S. (c)는 `Paginated<T>`용 `ApiPaginatedResponse` 데코레이터. (e)는 #29 직렬화 결정과 같이 |
| 8 | Swagger·스크립트 | `swagger-spec.json`(추적됨); `scripts/generate-swagger-clean.js:125-127`; `package.json:27` | `swagger-spec.json`을 만드는 코드가 없다. `swagger:build:clean`은 빌드한 뒤 **커밋된 옛 JSON**으로 HTML을 만든다 → 카테고리 API 없음, 스키마 이름이 옛 `CreateDto/ResponseDto`. `npm run build` 단계는 결과에 쓰이지 않는다 | 앱에서 `SwaggerModule.createDocument` 결과를 파일로 쓴다 | 관례 — 문서 객체는 `SwaggerModule.createDocument`가 만든다(openapi/introduction). 파일 저장 예제 절은 확인하지 못함 | 버그(문서) | S–M | `withFakeMongoose`로 DB 없이 문서를 만들어 쓰는 스크립트(또는 bootstrap 테스트와 같은 방식). **TODO 1-2 생성물 정리와 같이** — 거기에 "현재 생성물이 낡았다"를 추가 |
| 9 | 직렬화 | `src/utils/Mapper/mapper.ts:31`; 비교 `category.service.ts:216-217` | `Date.toLocaleString()` — 서버의 locale·TZ에 따라 형식이 바뀐다(개발 PC 한국어, 컨테이너는 보통 en-US/UTC). 카테고리는 ISO Date | JSON 기본 ISO 8601 | 관례(`Date.prototype.toJSON`); techniques/serialization | 버그(**추정**: 운영 컨테이너 locale 확인 필요) | M | 4절 결정 1 — 프런트 계약이라 사용자 결정 |
| 10 | 설정·보안 | `src/main.ts:52-57`; `src/swagger/middleware/swagger.auth.middleware.ts:73` | 세션 secret이 `JWT_SECRET` 재사용(키 용도 분리 위반), `'fallback-secret'`는 `JWT_SECRET`이 필수라 도달 불가한 죽은 fallback. `secure` 쿠키인데 `trust proxy` 미설정 → TLS 종료 프록시 뒤에서는 쿠키가 안 붙어 Swagger 로그인이 유지되지 않음(**추정**). 운영에서 기본 MemoryStore. 비밀번호 비교가 `===`(타이밍 비교) | 별도 `SESSION_SECRET`(`getOrThrow`), `app.set('trust proxy', 1)`, `crypto.timingSafeEqual` | techniques/session(`app.use(session())`은 문서 표준); express-session README "cookie.secure", "MemoryStore" | 보안 | S | `SESSION_SECRET`을 `validateEnv` REQUIRED·`.env.example`·클라우드타입에 추가(배포 설정 필요). `app.use(session)` 자체는 표준이라 바꾸지 않는다 |
| 11 | 보안 | `src/utils/Api/api.ts:58` | 이메일을 URL 경로에 그대로 삽입(`#`·`?`·`/` 포함 시 다른 경로로 감) | `encodeURIComponent(email)` | 관례(WHATWG URL) | 보안(낮음) | S | 한 줄 수정 |
| 12 | 예외·로깅 | `api.ts:68-71`; `search-index.client.ts:61-69`; `service.ts:111,408,437` | 사용자 서비스 호출 실패를 로그 없이 `null`(키가 바뀌면 모든 작성자가 조용히 `'Unknown'`). 검색 클라이언트는 `res.ok`를 보지 않아 403/500도 성공 처리. PostsService의 `.catch(console.error)`는 클라이언트가 reject하지 않아 도달 불가 | 실패는 `Logger.warn`, HTTP 오류 상태 확인 | CLAUDE.md 로깅 규칙; techniques/logger | 유지보수(장애 은닉) | S | `.catch`는 **TODO 있음**(console 항목). 클라이언트 두 곳은 신규 |
| 13 | 모듈·DI | `src/utils/Authorization/Guard/auth.ts:3,15`; `Module/module.ts:24-30`; 함정 1(CLAUDE.md:73) | `JwtAuthGuard`가 `JwtService`를 주입받지만 **쓰지 않는다**. 이 의존성 때문에 가드를 쓰는 모듈마다 `AuthModule` import가 필요해졌다. `JwtModule.signOptions(expiresIn 60s)`도 이 서비스는 서명하지 않으니 무의미(서명은 `test/app/config.spec.ts:72`만) | `export class JwtAuthGuard extends AuthGuard('jwt') {}` — 의존성 없음. 검증은 `JwtStrategy`의 `secretOrKey` | recipes/passport "Implementing Passport JWT" | 유지보수 | M | 생성자 제거 → `JwtModule` 제거 가능 여부는 4절 결정 4. `config.spec.ts`가 `JwtService.sign`으로 secret을 확인하므로 테스트도 바뀐다 |
| 14 | 모듈·DI | `app.module.ts:33`; `Authorization/Module/module.ts:31-32`; `post/Module/module.ts:45`; `category/module/category.module.ts:35` | `AppModule`의 `HttpModule`(AppModule에는 쓰는 프로바이더 없음), `AuthModule` providers의 `Reflector`(core가 전역 제공)·`RolesGuard`(아무도 주입받지 않음), `PostsService`·`CategoryService`·`PassportModule` export(가져다 쓰는 모듈 없음) | 쓰는 모듈에서만 import, 필요할 때만 export | techniques/http-module; modules "Shared modules" | 유지보수 | S | 삭제. `RolesGuard`는 #2에서 `APP_GUARD`로 쓰면 그때 등록 |
| 15 | 데이터 계층 | `src/modules/post/Module/module.ts:30-33` | `PostsModule`이 `Category` 모델을 `forFeature`로 다시 등록 | 모델 소유 모듈이 `MongooseModule`을 export하고 사용 모듈은 그 모듈을 import | techniques/mongodb "Model injection"(**문서 확인**) | 유지보수 | S | `CategoryModule.exports: [MongooseModule]` + `PostsModule.imports: [CategoryModule]` (또는 `CategoryService`에 조회 메서드) |
| 16 | 죽은 코드 | `src/config/{cors,database,swagger}.ts`; `src/utils/pagination/DTO/dto.ts`; `service.ts:451-584`(`findByAuthor`, `searchPosts`, `findByThemeAndCategory`) + 해당 테스트 `service.spec.ts:660-760`; `src/database/init/post.init.ts` + `module.ts:43`; `test/helpers/mock.module.ts:3`(`APP_GUARD` 미사용 import)·`MockAuthModule`의 `JwtAuthGuard` provider(e2e는 `overrideGuard`로 이미 교체); `package.json:28-31`(`swagger:serve`는 의존성에 없는 http-server, `swagger:open`은 Windows 전용 `start`, `migrate:*`) | 어디서도 호출하지 않음. `searchPosts`는 사용자 입력을 이스케이프 없이 `$regex`에 넣고 객체 필드(`content`)에 regex를 건다. `PostInitService`는 빈 배열인데 기동마다 `console.log` | 삭제 | 관례 | 유지보수 | S | `config/*`·`migrate:*`는 **TODO 있음**, `post.init.ts`의 console은 **TODO 있음**. 나머지는 신규. `findByAuthor` 등을 나중에 쓸 계획이면 결정 필요 |
| 17 | 유지보수 | `service.ts:78-83` 외 populate 체인 8회, `SearchIndexPayload` 조립 `:93-110`/`:390-407`, `findAll`(`:136`)과 `findByThemeAndCategory`(`:505`) 복붙 | 경로마다 응답 필드가 다르다: `findAll/findOne/findForEdit/update`는 `mainCategory`만, `create` 등은 label·sub까지 채움. `as any` 다수(src 전체 41곳, TODO의 38곳보다 늘었음) | 한 곳에서 조회·변환 | 관례(DRY) | 유지보수 | M | `findPopulatedById`, `toResponse`, `toIndexPayload` private 헬퍼. #1과 같은 묶음(응답이 함께 바뀜). `any` 개수는 **TODO 있음** — 숫자만 갱신 |
| 18 | DTO | `src/modules/post/DTO/update-post.dto.ts:16-93` | 수기로 `@IsOptional()`을 붙인 복제본 | `export class UpdatePostDto extends PartialType(CreatePostDto) {}` (Swagger를 쓰므로 `@nestjs/swagger`의 `PartialType`) | openapi/mapped-types; CLI 기준선 `nest g resource`의 `update-post.dto.ts` | 유지보수 | S | `.claude/rules/dto.md`의 예외 문장도 삭제 |
| 19 | DTO·enum | `create-category.dto.ts:37-44`; `controller.ts:128,485`, `service.ts:369` | 카테고리 `group`은 Swagger에만 `enum`, 검증 없음(아무 문자열 저장). 역할은 문자열 리터럴 `'admin'` | TS `enum CategoryGroup` + `@IsEnum`; `enum Role` | class-validator `@IsEnum`; guards 예제의 `Role` enum | 버그(데이터 정합성)·유지보수 | S | `category-group.enum.ts`, `role.enum.ts`. `Role`은 #2의 Spring 권한 문자열 정규화와 같이 |
| 20 | 요청 파이프라인 | `src/main.ts:32-43`; `docs/architecture.md:334` | `ValidationPipe`를 `main.ts`에서만 등록 → `bootstrap.spec`·e2e는 검증 없이 돈다 | `{ provide: APP_PIPE, useValue: new ValidationPipe({...}) }` | pipes "Global scoped pipes" | 유지보수(테스트 공백) | S | 4절 결정 5. 옮기면 bootstrap 테스트로 400 케이스 검증 가능 |
| 21 | 요청 파이프라인 | `src/main.ts:60-61` | `app.use(express.json({ limit: '10mb' }))` — Nest가 이름이 `jsonParser`인 미들웨어를 보고 자기 파서를 건너뛰어서 동작한다(`express-adapter.js:334`) | `NestFactory.create<NestExpressApplication>()` + `app.useBodyParser('json', { limit: '10mb' })` | faq/raw-body "Body parser size limit"(**문서 확인**) | 유지보수 | S | `urlencoded`도 같이 |
| 22 | 미들웨어 | `src/main.ts:64`; `swagger.auth.middleware.ts:43-62`; 함정 7(CLAUDE.md:80) | `@Injectable() … implements NestMiddleware` 클래스를 DI 밖에서 `new`하고, `this` 유지를 위해 `use`를 화살표 속성으로 둠. 세션 타입은 지역 `CustomSession`/`CustomRequest` 인터페이스 | `app.use()`로 거는 전역 미들웨어는 함수형(DI 접근 불가). 세션 필드는 `declare module 'express-session' { interface SessionData { swaggerAuthorized?: boolean } }` | middleware "Global middleware"(**문서 확인**); @types/express-session 선언 병합 | 유지보수 | S | `createSwaggerAuthMiddleware(config)` 함수로. `MiddlewareConsumer` 전환은 Swagger 라우트가 init 전에 등록돼 순서 검증이 필요 → 4절 결정 6 |
| 23 | 라우트·Swagger | `controller.ts:36-37`; `category.controller.ts:42-43`; `main.ts:71-72,77` | `@Controller('api/v1/posts')`처럼 prefix·버전을 경로 문자열에 하드코딩. 태그 이름이 `'api/v1/posts'` | `app.setGlobalPrefix('api')` + `enableVersioning({ type: VersioningType.URI })` + `@Controller({ path: 'posts', version: '1' })`; `@ApiTags('posts')` | techniques/versioning; faq/global-prefix; openapi/operations "Tags" | 유지보수·미관 | M | 4절 결정 3. URL은 그대로 유지 가능. Swagger 경로 `api/posts/swagger`는 v1 밖(게이트웨이 라우팅 때문일 수 있음) — 바꾸지 않는다 |
| 24 | 컨트롤러 | `controller.ts:131,367,445` | `@Request() request: any`로 `request.user.sub/role` 접근 | `@Req()`보다 커스텀 `@CurrentUser()` 데코레이터 + `JwtPayload` 타입 | custom-decorators "User decorator" | 유지보수 | S | `current-user.decorator.ts` |
| 25 | 스키마 타입 | `post.schema.ts:15`; `category.schema.ts:18-21`; 주입 `service.ts:20-21`, `post.init.ts:44`, `category.service.ts:31`; `.claude/rules/schemas.md:6` | `X & Document`. `Model<PostDocument>`·`Model<Post>`·`Model<Category>`·`Model<CategoryDocument>` 혼용. timestamps 타입이 Post에만 없어 `(x as any).createdAt` | `export type PostDocument = HydratedDocument<Post>`, 주입은 `Model<Post>` | techniques/mongodb "Model injection"(**문서 확인**) | 유지보수 | S | 규칙 파일 `schemas.md`가 옛 방식을 지시하므로 같이 고친다 |
| 26 | 설정 | `search-index.client.ts:42,51,65,82,95`; 비교 `api.ts:44-45` | 필수값 `INTERNAL_API_KEY`를 호출마다 `get() ?? ''`로 읽음(같은 키를 `InternalApiClient`는 생성자에서 `getOrThrow`). Logger 이름이 `'SearchIndex'`(규칙은 `ClassName.name`). HTTP를 하나는 `fetch`, 하나는 `HttpService`로 | 생성자에서 `getOrThrow`, `new Logger(SearchIndexClient.name)`, HTTP 클라이언트 하나 | CLAUDE.md 코딩 규칙; 관례 | 유지보수 | S | #12와 같은 커밋 |
| 27 | main.ts | `main.ts:14,16,27,47,67-74,84` | logger 배열에 `'verbose'` 중복(배열 전체가 기본값과 같음), `@nestjs/common` import 두 줄, CORS fallback `localhost:3000` 하드코딩, `DocumentBuilder`가 죽은 `config/swagger.ts`와 중복, `bootstrap();` floating promise(기준선 oxlint는 `no-floating-promises: error`) | 옵션 생략 또는 환경별 레벨, import 합치기, `void bootstrap()` | 관례; CLI 기준선 `main.ts`(ESM이라 `await bootstrap()`) | 미관·유지보수 | S | 한 커밋 |
| 28 | 테스트 | `test/` 전체 | 카테고리 모듈 테스트 0건. 테스트 경로 `test/post/Service/service.spec.ts`(PascalCase·일반 명사), describe/it 언어 혼재(단위는 영어 `should …`, e2e는 한국어), spec 파일의 describe마다 `@param/@returns` JSDoc과 틀린 `@module test/Service/service.spec`, `TestAuthGuard`가 쓰지 않는 `AuthGuard('jwt')`를 상속, `bootstrap.spec.ts:17-18` `any` | CLI 기준: spec은 대상 옆(`posts.service.spec.ts`), e2e는 `test/*.e2e-spec.ts` | CLI 기준선; fundamentals/testing | 유지보수 | S–M | `CategoryService` 정상·예외 테스트 추가가 가장 값이 큼. 위치는 4절 결정 7. e2e 운영 DB는 **TODO 있음** |
| 29 | 직렬화 | `mapper.ts`, `fieldname.extractor.ts`; 사용처 `post-response.dto.ts` 전 필드 | 커스텀 `@Field` + `mapToDto`(populate 객체를 그대로 복사 → #7(e)). 카테고리는 손으로 객체 리터럴 | class-transformer `@Expose()` + `plainToInstance(Dto, obj, { excludeExtraneousValues: true })` 또는 `ClassSerializerInterceptor` | techniques/serialization | 유지보수 | M | 4절 결정 1. 결정 전에는 #9만 따로 고칠 수 없다(같은 함수) |
| 30 | 주석·JSDoc | `controller.ts:41-123,135-187,209-276,292-351,372-432,450-479`(요청/응답 예시 JSON); `controller.ts:216,227-230`; `controller.ts:141-142,166-167`, `service.ts:56-61,119-134`; `strategy.ts:37,40-45`; `post.schema.ts:80`, `create-post.dto.ts:42`; 모든 파일의 `@module` | (a) 예시 JSON이 JSDoc에 중복(CLAUDE.md 규칙 위반)이고 옛 필드(`theme`, `category`) (b) **`x-viewed` 설명이 반대**: "true일 경우 조회수 증가"라 적혔지만 코드는 true면 증가를 건너뜀 (c) Strategy는 `{email, role}`을 돌려준다고 적혔지만 `{sub, role}`, 예시 `"auth": "user"`는 Spring `ROLE_*`와 다름 (d) 서브 카테고리 설명이 옛 구조(Swagger에 노출) (e) `@module` 값이 경로와 안 맞음(`Controller/controller`, `dto/index`, `Mapper/mapper` 등) (f) `{type}` 표기는 TS에서 중복, `SearchIndexPayload` 주석만 영어 | 한국어 JSDoc, 예시는 Swagger 데코레이터 | CLAUDE.md 코딩 규칙; TSDoc 관례 | 유지보수 | S | (b)(c)(d)는 오해를 부르는 오류라 먼저 |
| 31 | 명명·위치 | 2절 표 참고 | post 모듈·utils의 PascalCase 폴더와 일반 명사 파일명(**결정된 예외**). 예외가 아닌 것: 카테고리의 레이어 폴더(`controller/`, `service/`, `module/`) — CLI는 기능 폴더에 평평하게 둔다(CLAUDE.md가 이것을 "Nest 표준"이라 적은 것은 부정확), `swagger.auth.middleware.ts`(이름 안의 `.`), `fieldname.extractor.ts`(실제로는 데코레이터), `utils/types/pagination.ts`, `utils/Api/api.ts`, `database/init/post.init.ts`, 폴더 `post`(단수) vs `PostsModule`(복수), `Category*`(단수) vs CLI `nest g resource categories` → `CategoriesModule`. `utils/`에 인증 모듈·HTTP 클라이언트 프로바이더·데코레이터가 섞여 있음 | `src/<feature-plural>/<feature>.<type>.ts`, `dto/`, `schemas/`; 인증은 `src/auth/`(`jwt-auth.guard.ts`, `jwt.strategy.ts`, `roles.guard.ts`, `roles.decorator.ts`) | CLI 기준선; recipes/passport; guards | 유지보수·미관 | L | **결정된 예외**(decisions.md 2026-10-22 4번, TODO 2절 4) — 전환 시 2절 표대로. `forceConsistentCasingInFileNames: true` 복구(**TODO 있음**)와 같은 브랜치 |
| 32 | import | src 50곳 중 `src/...` 1곳(`controller.ts:25`), test 29곳 중 4곳; `controller.ts:24-25`처럼 한 파일 안에서 혼재; 순서 무작위(`main.ts:8-16`) | 초안 결정은 `src/...` 절대경로 | CLI 기준선은 상대경로. 순서 규칙은 lint 관례 | decisions.md 초안 1번(**결정된 예외**, 초안) | 미관 | S | 리네임 묶음에서 한꺼번에(어차피 거의 모든 import가 바뀐다) |
| 33 | 서식 | `post/DTO/*.ts`(4칸 들여쓰기), DTO·category 파일 끝 빈 줄 3~5개, 파일 끝 개행 없음 16개(`main` 외 `module.ts`, `auth.ts`, `role.ts`, `strategy.ts`, `mapper.ts`, `mock.module.ts` 등) | `.editorconfig`와 불일치 | `.editorconfig`(2칸, 끝 개행) + prettier | 프로젝트 설정 | 미관 | S | CRLF 정리(**TODO 있음**, 결정 2) 후 `prettier --write` 한 번 |
| 34 | 설정 파일 | `tsconfig.json`, `tsconfig.build.json`, `package.json:12,19-24,81-104`, `.eslintrc.js`, `.gitattributes` | `nest new`(CLI 12.0.10) 기준선과 차이: ESM(`"type": "module"`, `.js` 확장자 import, top-level await) / jest 대신 vitest / eslint 8 대신 oxlint / `strict: true` vs 여기 `strict: false`+`strictNullChecks`+`noImplicitAny: false` / `target` ES2023 vs ES2021 / `resolvePackageJsonExports` 없음 / `forceConsistentCasingInFileNames: false` / `tsconfig.build.json`에 `include: ["src"]` 없음 / `.gitattributes`에 `eol=lf` 없음 / `build` 스크립트에 `echo '…'`(Windows cmd에서 따옴표째 깨져 출력됨 — 이번 빌드에서 확인) / jest `collectCoverageFrom: **/*.(t|j)s`가 `dist`·`scripts`까지 포함 / 패키지 이름 snake_case | CLI 기준선 | CLI 기준선 | 유지보수·미관 | S–L | ESM은 **결정된 예외**(CJS 유지). eslint·`forceConsistentCasing`·`.gitattributes`·`any`는 **TODO 있음**. 신규: `build` echo 제거, `include: ["src"]`, `collectCoverageFrom`을 `src/**`로. vitest·oxlint 전환은 4절 결정 8 |
| 35 | API 계약 | `post-response.dto.ts:23`(`_id`) vs `category-response.dto.ts:28`(`id`); 날짜 문자열 vs Date | 리소스마다 id 필드명·날짜 형식이 다름 | 한 API 안에서 일관 | 관례 | 미관(계약) | M | 4절 결정 1과 같이 |

표 밖에서 **위반 아님**으로 확인한 후보:

- `main.ts`의 `app.use(session(...))` — techniques/session의 표준 예제와 같다. 위반은 #10의 값·옵션뿐.
- `src/config/env.validation.ts` — techniques/configuration "Custom validate function" 예제가 같은 파일명(`env.validation.ts`)을 쓴다. 표준과 일치.
- 카테고리 `activeOnly?: boolean` 쿼리 — `ValidationPipe.transformPrimitive`가 `'true'`만 true로 바꾼다(`validation.pipe.js:224`). 정상.
- `ROLES_KEY`, `REQUIRED`, `OPTIONAL` 상수 표기, 환경 변수 이름(전부 UPPER_SNAKE_CASE), 컬렉션명(`posts`, `categories`), `Post`/`Category`/`*Schema` 명명, I 접두사 없음, DTO 클래스명(`CreatePostDto`, `PostResponseDto` 등)은 표준대로다.
- `SearchIndexPayload.post_id`(snake_case)는 Django와의 외부 계약 — 예외로 둔다.
- `nest-cli.json`의 `assets`(`swagger/views`) — 필요한 설정이고 빌드 결과에 복사되는 것도 확인. (`watchAssets`가 없어 `start:dev`는 HTML 변경을 다시 복사하지 않지만 실행 금지 명령이라 영향 없음)

---

## 2. 명명 전환 영향표

추천 목표 구조(4절 결정 2의 추천안 A): CLI 평면 구조 + 복수형 기능 폴더 + `src/auth`, `src/common`. "바뀌는 import"는 그 파일을 import하는 **다른 파일의 import 문 수**(src+test, JSDoc 제외). 옮기는 파일 자신의 import도 경로가 바뀌므로 별도로 고쳐야 한다.

| 현재 경로 | 표준 경로 | 바뀌는 import | Windows 대소문자만 바뀌는 리네임(`git mv` 두 단계) |
|---|---|---|---|
| `src/modules/post/Controller/controller.ts` | `src/modules/posts/posts.controller.ts` | 1 (posts module) | 아니오(경로가 다름) |
| `src/modules/post/Service/service.ts` | `src/modules/posts/posts.service.ts` | 3 (controller, module, `service.spec.ts`) | 아니오 |
| `src/modules/post/Module/module.ts` | `src/modules/posts/posts.module.ts` | 1 (`app.module.ts`) | 아니오 |
| `src/modules/post/DTO/` (4파일) | `src/modules/posts/dto/` | 6 (controller, service, `mock-generator.ts`, `test-utils.ts`, `service.spec.ts`, `posts.e2e-spec.ts`) | **예** — `post`→`posts`를 먼저 옮겨도 그 안의 `DTO`→`dto`는 대소문자만 다르다. 폴더를 `post`로 유지하면 당연히 예 |
| `src/modules/post/schemas/post.schema.ts` | `src/modules/posts/schemas/post.schema.ts` | 5 (service, module, `post.init.ts`, `fake-mongoose.ts`, `service.spec.ts`) | 아니오 |
| `src/modules/category/controller/category.controller.ts` | `src/modules/categories/categories.controller.ts` (클래스 `CategoriesController`) | 1 | 아니오 |
| `src/modules/category/service/category.service.ts` | `src/modules/categories/categories.service.ts` (`CategoriesService`) | 2 (controller, module) | 아니오 |
| `src/modules/category/module/category.module.ts` | `src/modules/categories/categories.module.ts` (`CategoriesModule`) | 1 (`app.module.ts`) | 아니오 |
| `src/modules/category/dto/` | `src/modules/categories/dto/` | 2 (controller, service의 `'../dto'` → `'./dto'`) | 아니오 |
| `src/modules/category/schemas/category.schema.ts` | `src/modules/categories/schemas/category.schema.ts` | 6 (category module·service, posts module·service, `fake-mongoose.ts`, `service.spec.ts`) | 아니오 |
| `src/utils/Authorization/Module/module.ts` | `src/auth/auth.module.ts` | 3 (`app.module.ts`, posts module, category module) | 아니오 |
| `src/utils/Authorization/Guard/auth.ts` | `src/auth/jwt-auth.guard.ts` | 4 (posts controller, category controller, `mock.module.ts`, e2e) | 아니오 |
| `src/utils/Authorization/Guard/role.ts` | `src/auth/roles.guard.ts` | 1 (auth module) | 아니오 |
| `src/utils/Authorization/Guard/roles.decorator.ts` | `src/auth/roles.decorator.ts` | 2 (posts controller, roles guard) | 아니오 |
| `src/utils/Authorization/Strategy/strategy.ts` | `src/auth/jwt.strategy.ts` | 1 (auth module) | 아니오 |
| `src/utils/Api/api.ts` (`InternalApiClient`) | `src/common/clients/user-service.client.ts` (`UserServiceClient` 권장, 클래스명 유지도 가능) | 5 (posts module, posts service, `service.spec.ts`, `mock.module.ts`, e2e) | 아니오 (`utils/api`로만 바꾸면 **예**) |
| `src/utils/Api/search-index.client.ts` | `src/common/clients/search-index.client.ts` | 3 (posts module, posts service, `service.spec.ts`) | 아니오 |
| `src/utils/Mapper/mapper.ts` | `src/common/utils/map-to-dto.ts` (결정 1에서 class-transformer로 가면 삭제) | 1 (posts service) | 아니오 |
| `src/utils/Mapper/fieldname.extractor.ts` | `src/common/decorators/field.decorator.ts` (결정 1에서 `@Expose`로 가면 삭제) | 1 (`post-response.dto.ts`) | 아니오 |
| `src/utils/types/pagination.ts` | `src/common/interfaces/paginated.interface.ts` (#7(c)를 하면 `common/dto/paginated-response.dto.ts`) | 2 (posts controller, posts service) | 아니오 |
| `src/swagger/middleware/swagger.auth.middleware.ts` | `src/swagger/swagger-auth.middleware.ts` | 1 (`main.ts`) | 아니오 |
| `src/swagger/views/swagger-auth.html` | 그대로 (`__dirname` 기준 경로 `'..', 'views'` → `'views'`로 수정 필요, `nest-cli.json` assets 그대로) | 0 (경로 문자열 1곳) | 아니오 |
| `src/database/init/post.init.ts` | 삭제(#16) | 1 (posts module) | — |
| `src/utils/pagination/DTO/dto.ts` | 삭제(#16) | 0 | — |
| `test/post/Service/service.spec.ts` | 결정 7 A: `test/posts/posts.service.spec.ts` / B: `src/modules/posts/posts.service.spec.ts` | 0 (자신의 import 13개는 바뀜) | 아니오 (`test/post/service/`로만 바꾸면 **예**) |
| `test/post/e2e/posts.e2e-spec.ts` | `test/posts.e2e-spec.ts` (CLI 기준선 위치) | 0 (자신의 import 9개, `jest-e2e.json`의 `moduleNameMapper` 확인) | 아니오 |

합계: 파일 리네임 약 24개, 다른 파일의 import 문 약 **58곳**, 고쳐야 할 파일 19개(src 14, test 5) + 문서(`CLAUDE.md`, `docs/architecture.md`, `.claude/rules/*.md`의 `paths`, `.claude/skills/add-endpoint/SKILL.md`). 클래스명 변경(`Category*` → `Categories*`)을 하면 클래스 참조가 추가로 바뀐다(`CategoryService` 3곳, `CategoryModule` 1곳, `CategoryController` 1곳). 대소문자만 바뀌는 리네임은 추천안 A에서 `DTO→dto` 1건뿐이다.

---

## 3. 수정 묶음 제안

순서는 위험이 작고 효과가 큰 것부터. 리네임(묶음 F)은 diff를 덮으므로 동작 수정을 먼저 끝내고 마지막에 한다. 브랜치는 main에서 딴다(PR #2는 2026-10-22 병합 완료).

| 순서 | 묶음 | 포함 항목 | 브랜치 / 커밋 | 테스트 영향 |
|---|---|---|---|---|
| 1 | **A. 데이터·검증 버그** | #1 ref, #5 `@IsNotEmpty`, #6 `ParseObjectIdPipe`, #4 페이지네이션 Query DTO, #19 `CategoryGroup` enum 검증 | `fix/data-validation` — 커밋 4개(ref / DTO 검증 / ObjectId 파이프 / 페이지 쿼리) | 단위: `service.spec.ts`의 `INVALID_ID` 케이스 5곳(findOne/findForEdit/update/remove/incrementViewCount)이 서비스에서 컨트롤러 파이프로 이동 → 서비스 테스트 수정, 파이프는 bootstrap 테스트에 400 케이스. 스키마 ref 테스트 신규. e2e `:209` 기대값 404→400 |
| 2 | **B. 권한(TODO 보안 최우선)** | #2 RolesGuard 등록 + 카테고리 쓰기 엔드포인트, #3 fail-closed, #19 `Role` enum, #14의 `RolesGuard`/`Reflector` 정리 | `fix/authorization` — Spring `auth` 클레임 형식 확인이 **선행 조건**(TODO 1단계) | `service.spec.ts:508` "backward compatibility" → 거부 케이스. RolesGuard 단위 테스트 신규. `TestAuthGuard`의 `role: 'admin'`이 정규화된 값과 맞는지 확인. bootstrap 테스트에 403 케이스 |
| 3 | **C. Swagger·문서 정확성** | #7(a)(b)(c)(d), #8 spec 생성, #23의 `@ApiTags` 이름만, #30 JSDoc 오류 | `docs/swagger-contract` — 커밋: 데코레이터 / 생성 스크립트 / JSDoc | `bootstrap.spec.ts`의 Swagger 테스트에 `security` 이름 일치·DELETE 204 검사 추가. DELETE 204는 실제 응답 코드가 바뀜 → 프런트 BFF가 200을 기대하는지 확인 |
| 4 | **D. 설정·파이프라인·로깅** | #10 세션, #11, #12, #20 `APP_PIPE`, #21 `useBodyParser`, #22 함수형 미들웨어, #26, #27, #14 나머지(HttpModule·exports), TODO의 console 3곳 | `refactor/pipeline` — 커밋: 세션·Swagger 인증 / 파이프·바디파서 / 클라이언트 로깅 / main 정리 | `SESSION_SECRET` 추가 → `test/app/env.ts`, `config.spec.ts`의 ENV_LINES, `env.validation.spec.ts` 수정. `APP_PIPE`로 옮기면 bootstrap 테스트에서 검증이 동작 → `.send({ title: 'x' })` 401 테스트는 가드가 먼저라 그대로. 클라이언트 테스트(`fetch` 모킹) 신규 권장. **배포 환경 변수 추가 필요** |
| 5 | **E. 죽은 코드·중복** | #16, #17, #18, #15, #13(결정 4 결과에 따라), `searchPosts` 삭제 | `refactor/cleanup` | 삭제 메서드의 테스트(`service.spec.ts:660-760`) 삭제. #17 헬퍼 추출 후 `expectedMainCategoryOnlyResponse`/`expectedEnrichedResponse` 두 기대 응답이 하나로 합쳐짐(응답 필드 통일 시). #13에서 JwtModule을 빼면 `config.spec.ts`의 `expectJwtSecret` 재작성 |
| 6 | **F. 명명·구조 전환** | #31, #32, #24 `@CurrentUser`, #25 HydratedDocument, #28 테스트 위치·이름, #33 서식(CRLF 정리 후), `forceConsistentCasingInFileNames: true` | `refactor/nest-naming` — 커밋: (1) `.gitattributes` + renormalize (TODO 결정 2) (2) `git mv`만 하는 커밋(내용 변경 없음, `DTO→dto`는 `DTO→dto_tmp→dto` 두 단계) (3) import 수정 (4) 클래스명 변경 (5) 문서·rules `paths` 갱신 | 모든 테스트의 import 경로 변경. 리네임 커밋은 `git log --follow`가 추적되도록 내용 변경과 분리. `tsc`·`npm test`·`npm run build` 커밋마다 |
| 7 | **G. 계약 변경(결정 후)** | #9 날짜, #29 직렬화, #35 id 필드, #7(e), #23 prefix·versioning | 프런트(`vans_story`)와 같이 배포 | `mapToDto` 대체 시 기대 응답 전부 재작성. 결정 전에는 착수하지 않음 |

---

## 4. 사용자 결정이 필요한 것

`TODO.md` 2절 결정 대기 표로 옮겼다(이 표의 1~10 → TODO 결정 5~14, 순서 다름). 확정되면 `docs/decisions.md`에 기록한다.

| # | 결정 | 추천안 | 대안 | 이유 |
|---|---|---|---|---|
| 1 | 응답 직렬화·날짜 형식·id 필드(#9, #29, #35, #7(e)) | class-transformer `@Expose()` + `plainToInstance(..., { excludeExtraneousValues: true })`, 날짜는 ISO 문자열, populate된 카테고리는 `mainCategory: { id, value, label }` 같은 명시적 형태 | (b) `mapToDto` 유지 + 날짜만 `toISOString()` (c) 현행 유지하고 운영 locale만 고정(`TZ=Asia/Seoul`, `LANG=ko_KR`) | 프런트 계약이 바뀐다. 운영 컨테이너의 실제 locale을 먼저 확인하면 지금도 영어 형식인지 알 수 있다 |
| 2 | 폴더 구조 목표(#31) | A: CLI 평면 구조 `src/modules/posts/posts.controller.ts`, 복수형 폴더·클래스(`CategoriesModule`), `src/auth`, `src/common/{clients,decorators,interfaces}` | B: 현재 category처럼 레이어 폴더 유지(`posts/controller/posts.controller.ts`) — CLAUDE.md의 현 문구와 맞지만 CLI 출력과 다름 / C: `modules/` 래퍼 제거(`src/posts`) | A는 `nest g`로 새 파일을 만들 때 그대로 맞는다. 클래스명 복수화(`Categories*`)는 선택 — 단수 유지 시 `CategoryModule` 그대로도 Nest 관례 위반은 아님 |
| 3 | 라우트 prefix·버전(#23) | `setGlobalPrefix('api')` + URI versioning, 외부 URL은 그대로 | 현행 하드코딩 유지 | URL이 바뀌지 않으면 위험이 작지만, Swagger 경로(`api/posts/swagger`)와 게이트웨이 규칙을 같이 확인해야 한다 |
| 4 | `JwtModule` 존치(#13) | 가드의 `JwtService` 주입 제거 + `JwtModule` 제거(이 서비스는 검증만 함). 함정 1과 모듈마다의 `AuthModule` import도 사라짐 | 주입만 제거하고 `JwtModule`은 유지(나중에 서명할 계획이 있으면) | `config.spec.ts`가 `JwtService.sign`으로 secret 전달을 검사하므로 테스트 방식이 바뀐다 |
| 5 | 전역 `ValidationPipe` 등록 위치(#20) | `APP_PIPE`(AppModule) — 테스트에서도 검증이 돈다 | `main.ts` 유지 + 테스트마다 `useGlobalPipes` | 문서상 둘 다 표준. 테스트 커버리지 차이 |
| 6 | Swagger 인증 미들웨어 형태(#22) | 함수형 미들웨어 팩토리, `app.use` 유지 | `MiddlewareConsumer.forRoutes('api/posts/swagger*')` — Swagger 라우트가 `listen()`의 init보다 먼저 등록되므로 미들웨어가 앞에 걸리는지 검증 필요 | 비용은 둘 다 S, 대안은 동작 검증이 필요 |
| 7 | 단위 테스트 위치(#28) | A: `test/` 유지, 폴더·파일명만 표준화(`test/posts/posts.service.spec.ts`) | B: CLI처럼 대상 옆에 colocate(`src/**/*.spec.ts`, jest `roots`는 이미 둘 다 포함) | B가 CLI 표준이지만 헬퍼(`test/helpers`)를 src에서 import하게 되고 `tsconfig.build.json`의 spec 제외가 필수가 된다 |
| 8 | 툴체인을 Nest 12 기준선(vitest, oxlint, `strict: true`)에 맞출지(#34) | 지금은 하지 않음. eslint는 TODO대로 flat config, `strict`는 `any` 축소 후 | vitest·oxlint로 전환 | ESM 전제(기준선)와 CJS 유지 결정이 충돌하는 부분이 있고 비용이 크다 |
| 9 | 미사용 조회 메서드(#16) | `findByAuthor`·`searchPosts`·`findByThemeAndCategory` 삭제(검색은 Django 서비스가 담당) | 엔드포인트로 노출할 계획이면 남기고 `searchPosts`의 regex 이스케이프 추가 | 계획 여부를 사용자만 안다 |
| 10 | `SESSION_SECRET` 도입(#10) | 새 필수 변수 | 현행(JWT 키 재사용) 유지 | 클라우드타입 환경 변수 추가가 배포 전에 필요 |

---

## 5. 부록: 이 서비스가 JWT를 직접 검증하는 이유

조사 후 질문("Kotlin 사용자 서버가 있는데 왜 여기서 따로 검증하나")에 대한 답. 현재 구조 설명은 `docs/architecture.md` "인증·권한" 절, 후속 작업은 `TODO.md` 3절 보안.

- 로컬 검증은 JWT의 설계 목적이다. 요청마다 사용자 서버에 물으면 그 서버가 단일 장애점이 되고, 받는 정보(`sub`, `auth`)는 토큰에 이미 있다.
- 검증을 생략할 수 있는 것은 앞단(게이트웨이·BFF)이 검증하고 이 서비스가 외부에서 직접 접근 불가능할 때뿐이다. 현재는 CORS 목록과 `Authorization: Bearer`를 직접 받으므로 외부 접근이 가능한 것으로 보인다(클라우드타입 네트워크 구성은 미확인).
- 진짜 약점은 HS512 공유 비밀키다. 검증할 수 있는 쪽은 토큰을 만들 수도 있어, 이 서비스에서 `JWT_SECRET`이 새면 모든 서비스에서 통하는 관리자 토큰을 만들 수 있다. 표준 해법은 RS256/ES256 + 사용자 서버의 JWKS 공개(`/.well-known/jwks.json`), 이 서비스는 `jwks-rsa`의 `secretOrKeyProvider`로 공개키 검증만.
- 만료 전 폐기(로그아웃·차단)는 로컬 검증으로 막을 수 없다. 짧은 만료 + 리프레시 토큰, 또는 민감한 엔드포인트만 introspection(RFC 7662). 별도 결정.
- 4절 결정 4(`JwtModule` 존치)와 연결된다: 이 서비스는 서명하지 않으므로 JWKS 전환 시 `JwtModule`은 필요 없다. 묶음 B(RolesGuard)가 먼저이고 충돌하지 않는다.
