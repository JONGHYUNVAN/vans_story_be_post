# Vans Dev Blog 백엔드 - 게시글 서비스

## 개발 환경
### 버전 정보
- NestJS: 11.0.0
- TypeScript: 5.1.3
- Node.js: >=20.0.0
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
- typedoc: ^0.27.9
- typedoc-material-theme: ^1.3.0

### 개발 환경 (dev)
#### 데이터베이스
- MongoDB 사용
- 접속 정보는 환경 변수로 관리

#### 서버 설정
- Port: 3001 (기본값)
- 메모리 제한: 512MB (`--max-old-space-size=512`)

### Swagger UI 설정
- 접근 경로: `http://localhost:3001/api/posts/swagger`
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
```
src/
├── modules/
│   └── post/
│       ├── Controller/      # API 컨트롤러
│       ├── Service/         # 비즈니스 로직
│       ├── DTO/            # 데이터 전송 객체
│       ├── schemas/        # MongoDB 스키마
│       └── Module/         # NestJS 모듈
├── utils/
│   ├── Api/               # 내부 API 클라이언트
│   ├── Authorization/     # 인증 관련 컴포넌트
│   ├── Mapper/           # DTO 변환기
│   ├── pagination/       # 페이지네이션 유틸리티
│   └── types/           # 타입 정의
├── config/              # 설정 파일
├── database/           # 데이터베이스 설정
└── swagger/           # Swagger 설정
```

### 전역 설정
#### 보안 설정
- JWT 기반 인증
- 가드를 통한 엔드포인트 보호
- 패스포트 전략 구현

#### Swagger 설정
- API 문서 자동화
- 엔드포인트, DTO 모델 문서화

## 주요 API 엔드포인트

### 게시글 (Post) API
API 기본 경로: `/api/v1/posts`

- **GET /api/v1/posts**: 모든 게시글 조회 (페이지네이션 지원)
  - 쿼리 파라미터: `theme`, `category`, `page`, `limit`
- **GET /api/v1/posts/:id**: 특정 ID의 게시글 조회
- **POST /api/v1/posts**: 새 게시글 생성 (관리자 권한 필요)
- **PATCH /api/v1/posts/:id**: 특정 ID의 게시글 업데이트 (관리자 권한 필요)
- **DELETE /api/v1/posts/:id**: 특정 ID의 게시글 삭제 (관리자 권한 필요)

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
  title: string;           // 게시글 제목
  topic: string;           // 게시글 주제
  description: string;     // 게시글 설명
  content: Record<string, any>;  // 게시글 내용 (Object)
  theme: string;           // 게시글 테마
  category: string;        // 게시글 카테고리
  authorEmail: string;     // 작성자 이메일
  tags: string[];          // 태그 목록
  viewCount: number;       // 조회수
  likeCount: number;       // 좋아요 수
  thumbnail?: string;      // 썸네일 이미지 (선택사항)
  language: string;        // 언어 (기본값: 'ko')
  createdAt: Date;         // 생성 일시 (자동 생성)
  updatedAt: Date;         // 수정 일시 (자동 생성)
}
```

## 문서화

프로젝트는 TypeDoc을 사용하여 문서를 생성합니다:

**TypeDoc**: Material 테마 기반 문서 생성
```bash
npm run docs
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

### 테스트(개발중)
```bash
npm test
npm run test:e2e
```

## 라이센스
이 프로젝트는 개인 블로그 프로젝트로,  
비공개(UNLICENSED) 라이센스로 보호됩니다.