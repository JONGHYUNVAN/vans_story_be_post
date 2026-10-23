# 코드 컨벤션

이 서비스의 코드가 **어디에 있어야 하고, 각 레이어가 무엇을 하고 무엇을 하면 안 되는지**를 정한다. 기준은 NestJS 공식 문서(docs.nestjs.com)와 Nest CLI 12 스캐폴딩 출력이다. 이 문서와 다른 프로젝트 고유 결정은 "프로젝트 결정"으로 표시하고 근거를 `docs/decisions.md`에 둔다.

- 새 코드는 이 문서를 따른다. 기존 코드 중 이 문서와 다른 곳은 7절 표에 있고 `TODO.md` 3절 "표준 준수" 묶음에서 옮긴다
- 세부 규칙: DTO `.claude/rules/dto.md`, 스키마 `.claude/rules/schemas.md`, 테스트 `.claude/rules/testing.md`. 이 문서와 충돌하면 이 문서가 우선이고 규칙 파일을 고친다
- 이 문서로 `TODO.md` 2절 결정 6(폴더 구조), 9(`ValidationPipe` 위치), 10(Swagger 미들웨어 형태), 11(단위 테스트 위치)을 Nest 표준 쪽으로 정했다(`decisions.md` 2026-10-22 "코드 컨벤션"). 결정 5(응답 직렬화·날짜·id), 7(prefix·버전), 8(`JwtModule`), 12~14는 아직 열려 있다

---

## 1. 폴더 구조

CLI 기준선(`nest g resource posts`, `nest g guard auth/roles --flat` 등)의 출력 그대로다. **기능 폴더 하나 = 모듈 하나**, 레이어별 하위 폴더를 만들지 않는다.

```
src/
├─ main.ts                      부트스트랩
├─ app.module.ts                루트 모듈
├─ config/
│  ├─ env.validation.ts         환경 변수 검증 (ConfigModule validate)
│  └─ cors.config.ts            `createCorsOptions(ConfigService)` — 값은 `.env`, 조립은 TS (YAML 쓰지 않음)
├─ auth/                        인증·인가 (기능에 속하지 않음)
│  ├─ auth.module.ts
│  ├─ jwt.strategy.ts
│  ├─ jwt-auth.guard.ts
│  ├─ roles.guard.ts
│  ├─ roles.decorator.ts
│  ├─ current-user.decorator.ts
│  ├─ role.enum.ts
│  └─ interfaces/authenticated-user.interface.ts
├─ common/                      여러 기능이 쓰는, 어떤 기능에도 속하지 않는 것
│  ├─ decorators/  dto/  filters/  interceptors/  interfaces/  pipes/  serialization/
├─ posts/                       기능 모듈 (복수형, `nest g resource posts`)
│  ├─ posts.module.ts
│  ├─ posts.controller.ts
│  ├─ posts.controller.spec.ts
│  ├─ posts.service.ts
│  ├─ posts.service.spec.ts
│  ├─ posts.constants.ts        (DEFAULT_/MAX_POSTS_PER_PAGE)
│  ├─ dto/
│  │  ├─ create-post.dto.ts  update-post.dto.ts  post-response.dto.ts  find-posts-query.dto.ts
│  │  └─ index.ts
│  └─ schemas/post.schema.ts    (CLI의 `entities/` 대신 — techniques/mongodb 예제 구조)
├─ categories/                  posts와 같은 구성
├─ user-service/                외부 서비스 연동 하나 = 모듈 하나
│  ├─ user-service.module.ts
│  └─ user-service.client.ts
├─ search-service/              환경 변수 이름(`SEARCH_SERVICE_URL`)을 따라 서비스 단위로
│  ├─ search-service.module.ts
│  └─ search-service.client.ts
└─ swagger/
   ├─ swagger.setup.ts          문서 메타데이터 + 인증 미들웨어 + `SwaggerModule.setup` (`setupSwagger`)
   ├─ swagger-auth.middleware.ts
   ├─ swagger.constants.ts      (SWAGGER_PATH)
   └─ views/swagger-auth.html   (nest-cli.json assets)
test/
├─ app/                         AppModule 전체를 띄우는 테스트(bootstrap, config)와 dummy-env.ts
├─ helpers/                     테스트 전용 픽스처·Fake·모의 객체 (src spec에서는 `test/helpers/...`로 import)
└─ *.e2e-spec.ts                e2e (CLI 기준선 위치)
```

| 무엇 | 어디 | 판단 기준 |
|---|---|---|
| 한 기능에서만 쓰는 것 (DTO, 스키마, 그 기능 전용 파이프·enum) | 그 기능 폴더 | 다른 기능이 import하지 않는다 |
| 두 기능 이상이 쓰고 어느 기능에도 속하지 않는 것 | `common/<종류>/` | 기능 이름이 파일에 들어가면 `common`이 아니다 |
| 인증·인가 | `auth/` | `common`에 섞지 않는다 |
| 외부 HTTP 서비스 호출 | 서비스별 모듈 (`user-service/`, `search-service/`) | 클라이언트를 export하고, 쓰는 모듈이 import한다 |
| 단위 테스트 | 대상 파일 옆 `*.spec.ts` | `tsconfig.build.json`이 `**/*spec.ts`를 제외한다 |
| e2e 테스트 | `test/*.e2e-spec.ts` | |
| 테스트 헬퍼 | `test/helpers/` | `src/`에 두지 않는다 |

`src/modules/` 같은 감싸는 폴더, `utils/` 같은 잡동사니 폴더는 만들지 않는다.

## 2. 이름

| 대상 | 파일 | 클래스·심볼 |
|---|---|---|
| 모듈 / 컨트롤러 / 서비스 | `posts.module.ts` / `posts.controller.ts` / `posts.service.ts` | `PostsModule` / `PostsController` / `PostsService` |
| DTO | `create-post.dto.ts`, `find-posts-query.dto.ts`, `post-response.dto.ts` | `CreatePostDto`, `FindPostsQueryDto`, `PostResponseDto` |
| 스키마 | `post.schema.ts` (단수) | `Post`, `PostSchema`, `PostDocument` |
| 가드 / 전략 / 파이프 / 인터셉터 / 필터 / 미들웨어 | `roles.guard.ts` / `jwt.strategy.ts` / `parse-x.pipe.ts` / `logging.interceptor.ts` / `http-exception.filter.ts` / `swagger-auth.middleware.ts` | 접미사를 붙인 PascalCase (`RolesGuard`, `JwtStrategy`) |
| 데코레이터 | `roles.decorator.ts`, `current-user.decorator.ts` | `Roles`, `CurrentUser` (+ 메타데이터 키 `ROLES_KEY`는 같은 파일) |
| enum / 인터페이스 | `role.enum.ts` / `authenticated-user.interface.ts` | 멤버 PascalCase. 새 enum의 값은 소문자 문자열(`Role.Admin = 'admin'`) — 외부·DB에 이미 저장된 값을 쓰는 enum은 그 값 그대로(`CategoryGroup.Frontend = 'Frontend'`) / `AuthenticatedUser` (`I` 접두사 없음) |
| 외부 연동 클라이언트 (프로젝트 결정) | `user-service.client.ts`, `search-service.client.ts` | `UserServiceClient`, `SearchServiceClient` — 환경 변수 `<NAME>_SERVICE_URL`의 이름을 따른다 |
| 상수 | `*.constants.ts` | `UPPER_SNAKE_CASE` |

- 파일·폴더는 kebab-case 소문자, 파일명에 `<이름>.<종류>.ts` 외의 점을 넣지 않는다
- 기능 폴더·모듈·컨트롤러·서비스는 복수형(리소스 이름), 스키마·엔티티 클래스는 단수형
- import (프로젝트 결정, `decisions.md` 2026-10-22 1번을 구체화): 같은 최상위 폴더(`src/posts/`, `test/`) 안은 상대경로(`./dto`, `./schemas/post.schema`), 다른 폴더는 `src/...`·`test/...` 절대경로. 순서는 외부 패키지 → `src/...` → 상대경로

### 통일 규칙

같은 개념은 같은 이름으로 쓴다. 근거와 바꾼 목록은 `docs/audits/2026-10-22-naming-review.md`.

| 대상 | 규칙 | 예 |
|---|---|---|
| 사람 | 요청자는 `userEmail`·`userRoles`, 게시글 소유자 필드와 그것으로 조회하는 인자는 `authorEmail`. `request.user`는 `{ email, roles }` — JWT 클레임 이름 `sub`는 전략 밖으로 내보내지 않는다 | `update(id, dto, userEmail, userRoles)` |
| 카테고리 | id는 `…CategoryId`, value 문자열은 `…CategoryValue`, 조회한 문서는 `mainCategory`/`subCategory`. `cat`·`subCat`·`main`·`sub` 같은 축약 금지 | `findAll(mainCategoryValue, …)` |
| DTO | 클래스는 정식 이름만(별칭 없음). 변수는 `create<Resource>Dto`/`update<Resource>Dto`/`queryDto`. 서비스 안 응답 변수는 `<resource>Response(s)`, 문서→응답 변환 private 메서드는 `toResponseDto` | `createPostDto`, `postResponses` |
| 주입 | 필드 이름은 클래스 이름 camelCase(`userServiceClient`, `categoriesService`, `postModel`). `ConfigService`는 `configService` — `config`는 원시 env 레코드와 `DocumentBuilder` 결과에만 | `constructor(private readonly configService: ConfigService)` |
| 메서드 | 조회 `find*`(전체를 묶으면 `findAll*`), 서비스 삭제 `remove`, 동사+대상 순서, 부수 효과는 인자·이름에 드러낸다 | `findAllGrouped`, `removePostFromIndex`, `findOne(id, hasViewed)` |
| 값 | boolean은 `is/has/should`. 모듈 수준 상수(메타데이터 키·기본값·테스트 픽스처 포함)는 `UPPER_SNAKE`, 모음은 `<feature>.constants.ts` | `RESPONSE_FIELDS_KEY`, `DEFAULT_POSTS_PER_PAGE` |
| 지역 이름 | `result`·`data`·`bad`·`expected`·`controller`·`err`·한 글자 대신 도메인 이름. `catch`는 `error`, 결과물은 `createdPost`/`updatedPost`/`deletedPost`, 중복 검사 결과는 `duplicate*`(`existing*`는 수정 대상에만) | `duplicateCategory` |
| JSDoc | `@module` 태그를 쓰지 않는다(typedoc `expand`가 경로로 이름을 붙인다) | |
| Swagger | 태그는 리소스 이름(`posts`, `categories`), 보안 스킴은 `@ApiBearerAuth()`(`addBearerAuth()` 기본 이름 `bearer`) | |
| 테스트 더블 | jest.fn 객체 팩토리는 `createMock<토큰 클래스>()`, 변수는 `mock<토큰 클래스>`. 손으로 짠 동작 구현은 `Fake<대상>`(`FakeJwtAuthGuard`, `withFakeMongoose`). `TestingModule`은 `moduleRef` | `createMockSearchServiceClient` |
| 테스트 픽스처 | 상수는 `UPPER_SNAKE`, lean 문서 타입은 `*LeanDoc`(mongoose `Document`와 구분), DTO는 `createValidDto(DtoClass, overrides)`. 인증 토큰은 역할을 이름에(`admin_token`) | `MAIN_CATEGORY_DOC` |
| 테스트 제목 | 최상위 describe는 대상 심볼, it은 한국어 "조건 + 결과"(상태 코드는 숫자, `테스트`·`- 에러`·`- 성공` 접미사 없음) | `it('작성자가 아니면 403')` |
| npm 스크립트 | `clean`은 산출물 삭제에만. 실행 금지 스크립트(`start*`, `test:e2e`, `test:all*`)는 `.claude/settings.json` deny 패턴과 함께가 아니면 이름을 바꾸지 않는다 | `swagger:html`, `docs:typedoc` |

API 계약에 속한 이름(경로, 쿼리·헤더, 요청·응답 JSON 필드, DB 필드, `SearchIndexPayload` 키, 오류 코드, 환경 변수)은 위 규칙과 달라도 이 문서만으로 바꾸지 않는다 — 프런트·다른 서비스와 같이 바꾼다(`TODO.md` 2절 결정 5·7).

## 3. 요청이 지나가는 순서

Nest 요청 생명주기(faq/request-lifecycle). 앞 단계는 뒤 단계의 결과를 모른다 — 가드는 검증된 body를 볼 수 없고, 파이프는 사용자가 누구인지 모른다.

```
미들웨어 → 가드 → 인터셉터(전) → 파이프 → 컨트롤러 → 서비스 → 인터셉터(후) → 예외 필터 → 응답
```

전역으로 거는 가드·파이프·인터셉터·필터는 `main.ts`의 `useGlobal*`이 아니라 모듈의 `APP_GUARD`·`APP_PIPE`·`APP_INTERCEPTOR`·`APP_FILTER` 프로바이더로 등록한다(pipes "Global scoped pipes"). DI를 쓸 수 있고 `Test.createTestingModule`에도 그대로 걸린다.

## 4. 레이어별 책임

### main.ts

| 한다 | 하지 않는다 |
|---|---|
| `NestFactory.create<NestExpressApplication>`, 앱 인스턴스에만 걸 수 있는 설정(`useBodyParser`, `enableCors`, `set('trust proxy')`, 세션, Swagger 문서 생성), `listen`. 설정 내용은 `ConfigService`를 받는 함수로 분리해 호출만 한다(`createCorsOptions`, `setupSwagger`) | 전역 파이프·가드·인터셉터·필터 등록(→ 3절 `APP_*`), `process.env` 읽기(→ `app.get(ConfigService)`), 비즈니스 로직, 비밀값 로그 |

### 모듈 (`*.module.ts`)

| 한다 | 하지 않는다 |
|---|---|
| `imports`·`controllers`·`providers`·`exports` 연결. 다른 모듈이 주입받는 것만 `exports` | 로직. 쓰지 않는 모듈 import·export. `@nestjs/core`가 이미 주는 `Reflector` 같은 것을 다시 provider로 등록 |
| 자기 스키마를 `MongooseModule.forFeature`로 등록하고, 다른 모듈이 그 모델을 써야 하면 `MongooseModule`을 export | 다른 기능의 스키마를 자기 모듈에서 다시 `forFeature` — 소유 모듈을 import한다(techniques/mongodb "Model injection") |
| 설정이 필요한 동적 모듈은 `forRootAsync`/`registerAsync` + `inject: [ConfigService]` | 데코레이터 인자에서 환경 변수 읽기(CLAUDE.md 함정 5) |

기능 모듈 사이 의존은 한 방향. `common/`·`auth/`·외부 연동 모듈은 기능 모듈(`posts`, `categories`)을 import하지 않는다. 순환이 생기면 `forwardRef`로 덮지 말고 구조를 고친다.

### 컨트롤러 (`*.controller.ts`)

HTTP를 서비스 호출로 번역만 한다.

| 한다 | 하지 않는다 |
|---|---|
| 라우트·HTTP 메서드·상태 코드(`@HttpCode`) 선언 | DB 접근, `@InjectModel`, 외부 HTTP 호출 |
| 입력을 데코레이터로 받기: `@Body() dto`, `@Query() queryDto`, `@Param('id', ParseObjectIdPipe)`, `@Headers('x-viewed')`, `@CurrentUser() user` | `@Req()`/`@Request()`로 요청 객체 통째로 받기, `@Res()`(Nest 표준 응답 처리가 꺼진다 — controllers "Library-specific approach") |
| 접근 제어 선언: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.Admin)` | 데이터에 따른 권한 판단(작성자 본인인지 등 — 서비스) |
| 서비스 메서드 하나를 부르고 그 결과를 그대로 반환 | `parseInt`·문자열 비교 같은 입력 변환(→ DTO·파이프), try/catch로 예외 바꾸기, 응답 객체 조립 |
| Swagger 데코레이터(`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth()`, `@ApiHeader`) | JSDoc에 요청/응답 JSON 예시 중복 (예시는 Swagger에) |

정적 경로(`grouped`, `value/:value`, `:id/edit`)는 `:id`보다 앞에 선언한다.

### 서비스 (`*.service.ts`)

비즈니스 로직이 있는 유일한 곳.

| 한다 | 하지 않는다 |
|---|---|
| 규칙 판단, 소유권 등 데이터에 따른 권한 판단, 존재 확인(참조 카테고리가 실제 있는지 등) | Express 타입(`Request`, `Response`)·헤더·쿠키 다루기 |
| 자기 모듈이 등록한 모델(`@InjectModel(Post.name) Model<Post>`)로 조회·저장 | 다른 기능의 모델을 직접 주입(그 모듈이 `MongooseModule`을 export한 경우만 허용) |
| 외부 연동 클라이언트 호출 | `ConfigService` 밖에서 `process.env` 읽기 |
| 실패를 Nest HTTP 예외로 던지기: 입력 규칙 위반 `BadRequestException`, 권한 `ForbiddenException`, 없음 `NotFoundException`, 중복 `ConflictException` | 예외를 잡아 삼키거나 `null`로 바꾸기. 예외 메시지에 사용자 입력·내부 URI·스택 넣기 |
| 응답 DTO로 변환해 반환 | mongoose 문서(hydrated document)를 그대로 반환 |
| 공개 메서드에 한국어 JSDoc | `console.*` (→ `new Logger(ClassName.name)`), `any` |

ObjectId 형식 검사는 서비스가 아니라 컨트롤러의 `ParseObjectIdPipe`(`src/common/pipes/parse-object-id.pipe.ts` — `@nestjs/mongoose`의 같은 이름 파이프가 아니다)가 한다(400). 서비스는 형식이 맞는 id를 받는다고 가정하고 "없음"만 404로 판단한다.

### DTO (`dto/*.dto.ts`)

| 한다 | 하지 않는다 |
|---|---|
| 클래스로 선언(인터페이스는 런타임 검증·Swagger 메타가 없다) | 메서드·로직 |
| 요청: 모든 속성에 class-validator + `@ApiProperty`/`@ApiPropertyOptional`. 필수 문자열은 `@IsNotEmpty()` | `@IsString()`만으로 필수 문자열 표현(빈 문자열이 통과한다) |
| 수정 DTO는 `PartialType(CreateXDto, { skipNullProperties: false })` (`@nestjs/swagger` — 기본값이면 `null`이 검증을 건너뛰어 필수 필드를 `null`로 덮어쓴다), 쿼리 문자열은 Query DTO(`@Type(() => Number) @IsInt() @Min() @Max()`) | 수기 복제, 컨트롤러에서 쿼리를 `string`으로 받아 변환 |
| 고정 값 집합은 enum + `@IsEnum` (Swagger `enum`과 같은 enum 사용) | Swagger에만 `enum`을 적고 검증 없음 |
| 응답: 실제로 나가는 형태 그대로 선언 | 선언과 다른 형태(populate 객체 등)를 내보내기 |

응답 직렬화 방식(class-transformer `@Expose` 등)과 날짜·id 형식은 `TODO.md` 2절 결정 5가 정해질 때까지 현행 `@ResponseField` + `mapToDto`(`src/common/serialization/`)를 쓴다.

### 스키마 (`schemas/*.schema.ts`)

| 한다 | 하지 않는다 |
|---|---|
| `@Schema({ timestamps: true, collection })` + `@Prop` + `SchemaFactory.createForClass` | 메서드·훅·가상 필드·비즈니스 로직 |
| 참조는 `@Prop({ type: Types.ObjectId, ref: '<클래스 이름>' })` — `ref`가 없으면 `populate`가 조용히 건너뛴다 | |
| `export type PostDocument = HydratedDocument<Post>`, 주입은 `Model<Post>` | `Post & Document` (구식) |
| 고정 값 필드는 DTO와 같은 enum으로 `enum` 지정 | |

### 가드 (`*.guard.ts`)

요청을 처리해도 되는지만 판단한다(guards). 판단 근거는 요청에 이미 있는 것(토큰에서 나온 `request.user`)과 라우트 메타데이터(`@Roles`)뿐이다.

| 한다 | 하지 않는다 |
|---|---|
| 인증 `JwtAuthGuard`(passport), 역할 인가 `RolesGuard`(`Reflector.getAllAndOverride`) | DB 조회가 필요한 판단(작성자 본인인지 → 서비스) |
| 거부 시 `false` 또는 `UnauthorizedException`/`ForbiddenException` | 요청 body 읽기(파이프 전이라 검증되지 않았다), `request.user` 외의 요청 변경 |
| 생성자 의존성은 실제로 쓰는 것만 | 쓰지 않는 서비스 주입(가드를 쓰는 모든 모듈에 그 의존성이 필요해진다) |

### 전략 (`*.strategy.ts`)

| 한다 | 하지 않는다 |
|---|---|
| 토큰 검증 설정(키, `algorithms`, 만료)과 페이로드 → `AuthenticatedUser` 변환. 외부 형식(Spring의 `ROLE_ADMIN`, `ADMIN`)을 내부 `Role`로 **여기서 한 번** 정규화 | 컨트롤러·서비스가 외부 권한 문자열을 직접 비교 |

### 파이프 (`*.pipe.ts`)

| 한다 | 하지 않는다 |
|---|---|
| 입력 하나의 형식 검증·변환(`ValidationPipe`, `ParseObjectIdPipe`, `ParseIntPipe`) | DB 조회(존재 확인은 서비스), 부수 효과 |
| 오류는 `BadRequestException` | 오류 메시지에 입력값 그대로 넣기 |

### 미들웨어 (`*.middleware.ts`)

라우팅 전에 Express 수준에서 도는 것만. 핸들러·메타데이터(`ExecutionContext`)를 모른다.

| 한다 | 하지 않는다 |
|---|---|
| 경로 단위 처리(Swagger UI 비밀번호 보호처럼 Nest 라우트가 아닌 경로) | API 라우트 인증·인가(→ 가드) |
| `app.use()`로 거는 전역 미들웨어는 함수형(middleware "Global middleware" — DI 컨테이너 밖) | `@Injectable()` 클래스를 `new`로 만들어 `app.use`에 넘기기 |

### 인터셉터·예외 필터

| 종류 | 한다 | 하지 않는다 |
|---|---|---|
| 인터셉터 | 여러 라우트에 공통인 전후 처리: 직렬화, 로깅, 타임아웃 | 비즈니스 로직 |
| 예외 필터 | 예외 → 응답 형식 변환 | 도입 전에 기본 필터로 충분한지 먼저 본다(현재 없음) |

### 외부 연동 클라이언트 (`*.client.ts`, 프로젝트 결정)

| 한다 | 하지 않는다 |
|---|---|
| 외부 서비스 하나의 HTTP 호출. URL·키는 생성자에서 `ConfigService`로(필수값은 `getOrThrow`) | 호출마다 설정 읽기, 키를 `?? ''`로 기본값 처리 |
| 타임아웃, HTTP 오류 상태 확인(`res.ok`), 실패 시 `Logger.warn`(키·토큰·URI 없이) | 실패를 로그 없이 `null`로 |
| 실패 계약을 JSDoc에 명시(던지는지, `null`인지, fire-and-forget인지) | URL에 사용자 입력을 인코딩 없이 넣기(`encodeURIComponent`) |
| HTTP는 `HttpService`(`@nestjs/axios`, techniques/http-module) 하나로, 반환 타입 선언 | 클라이언트마다 `fetch`·`HttpService`를 섞어 쓰기 |

### 설정 (`config/`)

`ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` 하나. 새 변수는 `validateEnv`의 `REQUIRED_ENV`/`OPTIONAL_ENV`와 `.env.example`에 같이 추가하고, 읽는 쪽은 `ConfigService`를 주입받는다. 검증 오류 메시지에 값을 넣지 않는다.

## 5. 인증·인가

- `request.user`의 형태는 `AuthenticatedUser`(`{ email: string; roles: Role[] }`) 하나다. 컨트롤러는 `@CurrentUser()`로 받고, 서비스에는 필요한 값만 넘긴다
- 역할로 막는 것은 `@Roles()` + `RolesGuard`, 데이터로 막는 것(작성자 본인)은 서비스. 둘 다 필요한 라우트는 둘 다 쓴다
- 쓰기 엔드포인트는 기본이 "막힘"이다: 권한 정보가 없거나 모르는 값이면 거부(fail-closed)
- Swagger: `@ApiBearerAuth()`(이름 없이 — `src/swagger/swagger.setup.ts`의 `addBearerAuth()` 기본 이름 `bearer`와 맞춘다. `test/app/bootstrap.spec.ts`가 등록되지 않은 스킴 이름을 잡는다)

## 6. 테스트

- 단위 테스트는 대상 옆 `*.spec.ts`. DB·네트워크 없이 돈다(모델·클라이언트는 프로바이더 교체)
- 서비스 메서드마다 정상 1건 + 던지는 예외 종류마다 1건. 가드·전략·파이프도 단위 테스트
- 검증·가드·상태 코드처럼 여러 레이어가 함께 만드는 동작은 모듈 기동 테스트(`withFakeMongoose`)로 HTTP 요청을 보내 확인한다
- describe/it 이름은 한국어로 동작을 쓴다(예: `'관리자가 아니면 403'`) — 프로젝트 결정(e2e가 이미 한국어, 문서·커밋 언어와 맞춤)
- 상세·헬퍼 사용법: `.claude/rules/testing.md`

## 7. 현행 코드와 다른 곳

폴더·파일·식별자 이름은 2026-10-22 명명 전환(`refactor/naming`)으로 이 문서와 맞췄다. 남은 차이는 이름이 아니라 구조·방식이다.

| 현행 | 이 문서 | 옮기는 곳 |
|---|---|---|
| `@Request() request: any` | `@CurrentUser() user: AuthenticatedUser` | #24 |
| `ValidationPipe`를 `main.ts`에서 `useGlobalPipes` | `APP_PIPE` | D |
| `SwaggerAuthMiddleware` 클래스를 `new`, 세션 타입은 지역 `CustomSession` | 함수형 미들웨어, `SessionData` 선언 병합 | D |
| `X & Document`, 주입 타입 `Model<PostDocument>`·`Model<CategoryDocument>` 혼용 | `HydratedDocument<X>`, 주입은 `Model<X>` | #25 |
| `@ResponseField` + `mapToDto`, 날짜 `toLocaleString()` | class-transformer 직렬화 | G(결정 5) |
| 결정 13 보류 메서드 `findByAuthor`·`searchPosts`·`findByThemeAndCategory`(이름이 규칙과 다름) | 삭제, 남기면 `findByAuthorEmail`·`findByKeyword`·`findByCategoryValues` | 결정 13 |
