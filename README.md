# Vans Dev Blog 백엔드 - 게시글 서비스

## 개발 환경
### 버전 정보
- NestJS: 11.0.0
- TypeScript: 5.1.3
- Node.js: >=20.0.0
- MongoDB: 8.11.0
- Mongoose: 8.11.0

### 주요 의존성
#### NestJS 핵심 모듈
- @nestjs/common: ^11.0.0
- @nestjs/core: ^11.0.0
- @nestjs/platform-express: ^11.0.0
- @nestjs/mongoose: ^11.0.1
- @nestjs/swagger: ^11.0.3

#### 보안 관련
- @nestjs/passport: ^11.0.0
- @nestjs/jwt: ^11.0.0
- passport: ^0.7.0
- passport-jwt: ^4.0.1

#### 데이터베이스
- mongoose: ^8.11.0
- @nestjs/typeorm: ^11.0.0 (보조)
- sqlite3: ^5.1.7 (테스트용)

#### 유틸리티
- nestjs-paginate: ^11.0.0
- rxjs: ^7.8.1
- reflect-metadata: ^0.2.0

#### 세션 관리
- express-session: ^1.18.1
- express-basic-auth: ^1.2.1

#### API 통신
- @nestjs/axios: ^4.0.0

#### 개발 도구
- @nestjs/cli: ^11.0.0
- @nestjs/schematics: ^11.0.0
- prettier: ^3.0.0
- eslint: ^8.42.0

#### 테스트
- @nestjs/testing: ^11.0.0
- jest: ^29.5.0
- supertest: ^7.0.0

#### 문서화
- jsdoc: ^4.0.4
- better-docs: ^2.7.3
- typedoc: ^0.28.0
- typedoc-plugin-markdown: ^4.5.0

### 개발 환경 (dev)
#### 데이터베이스
- MongoDB 사용
- 접속 정보는 환경 변수로 관리

#### 서버 설정
- Port: 3000 (기본값)
- 메모리 제한: 512MB (`--max-old-space-size=512`)

### Swagger UI 설정
- 접근 경로: `http://localhost:3000/api-docs`
- API 문서 기능:
  - API 그룹화
  - 메서드 기반 정렬
  - 응답 형식 문서화

### JWT 설정
- 환경 변수로 시크릿 키 관리
- 토큰 검증 전략 구현 (`JwtStrategy`)
- 가드 기반 인증 적용 (`JwtAuthGuard`)

## 프로젝트 구조

### 주요 디렉토리
- `src/`: 소스 코드
  - `Controller/`: API 컨트롤러
  - `Service/`: 비즈니스 로직
  - `DTO/`: 데이터 전송 객체
  - `schemas/`: MongoDB 스키마
  - `Mapper/`: DTO 변환기
  - `utils/`: 유틸리티 함수
    - `Api/`: 내부 API 클라이언트
    - `Authorization/`: 인증 관련 컴포넌트
  - `middleware/`: 미들웨어
  - `config/`: 설정 파일

### 전역 설정
#### 보안 설정
- JWT 기반 인증
- 가드를 통한 엔드포인트 보호
- 패스포트 전략 구현

#### Swagger 설정
- API 문서 자동화
- 엔드포인트, DTO 모델 문서화

### 글로벌 컴포넌트
#### API 응답 형식
모든 API 응답은 다음 구조를 따릅니다:
```typescript
{
  data: T;        // 응답 데이터 (제네릭 타입)
  meta?: object;  // 페이지네이션 등 메타데이터 (선택사항)
  links?: object; // 관련 리소스 링크 (선택사항)
}
```

#### 페이지네이션 응답 형식
```typescript
{
  data: T[];      // 페이지 데이터 배열
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy: [string, string][];
    searchBy: string[];
    search: string;
    filter: object;
    select: string[];
  };
  links: {
    current: string;
    next: string;
    previous: string;
  };
}
```

#### 예외 처리
- **NotFoundException**: 리소스를 찾을 수 없을 때
- 글로벌 예외 필터를 통한 일관된 오류 응답

## 주요 API 엔드포인트

### 게시글 (Post) API
- **GET /posts**: 모든 게시글 조회 (페이지네이션 지원)
- **GET /posts/:id**: 특정 ID의 게시글 조회
- **POST /posts**: 새 게시글 생성
- **PUT /posts/:id**: 특정 ID의 게시글 업데이트
- **DELETE /posts/:id**: 특정 ID의 게시글 삭제
- **GET /posts/author/:email**: 특정 작성자의 게시글 조회
- **GET /posts/search/:keyword**: 키워드로 게시글 검색
- **GET /posts/theme-category**: 테마와 카테고리로 게시글 필터링

## 인증 아키텍처

### JWT 기반 인증
- 인증 헤더로 JWT 토큰 전달 (`Authorization: Bearer {token}`)
- JwtStrategy를 통한 토큰 검증
- JwtAuthGuard를 사용하여 보호된 엔드포인트 접근 제어

### 인증 컴포넌트
1. **JwtStrategy**
   - 토큰 검증 및 사용자 정보 추출
   - 환경 변수에서 시크릿 키 로드

2. **JwtAuthGuard**
   - 보호된 리소스 접근 제어
   - 인증되지 않은 요청 거부

3. **InternalApiClient**
   - 사용자 서비스와의 내부 통신
   - 사용자 정보 (닉네임 등) 조회

## 데이터 모델

### 게시글 (Post) 스키마
```typescript
{
  title: string;        // 게시글 제목
  content: string;      // 게시글 내용
  theme: string;        // 게시글 테마
  category?: string;    // 게시글 카테고리 (선택사항)
  authorEmail: string;  // 작성자 이메일
  createdAt: Date;      // 생성 일시
  updatedAt: Date;      // 수정 일시
}
```

## 문서화

프로젝트는 두 가지 문서화 방식을 지원합니다:

1. **JSDoc**: HTML 형식의 문서 생성
   ```bash
   npm run docs
   ```

2. **TypeDoc**: Markdown 형식의 문서 생성
   ```bash
   npm run docs:typedoc
   ```

생성된 문서는 `docs/` 디렉토리에서 확인할 수 있습니다.

## 환경 설정

### 환경 변수
프로젝트는 다음과 같은 환경 변수를 사용합니다:
- `MONGODB_URI`: MongoDB 연결 문자열
- `JWT_SECRET`: JWT 시크릿 키
- `USER_SERVICE_URL`: 사용자 서비스 API 주소
- `PORT`: 서버 포트 (기본값: 3000)

## 시작하기

### 설치
```bash
npm install
```

### 개발 모드 실행
```bash
npm run start:dev
```

### 빌드 및 운영 모드 실행
```bash
npm run build
npm run start:prod
```

### 테스트
```bash
npm test
npm run test:e2e
```

## 라이센스
이 프로젝트는 비공개(UNLICENSED) 라이센스로 보호됩니다.