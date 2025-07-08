# VansDevBlog API 문서

## 개요

VansDevBlog는 NestJS 기반의 블로그 포스트 관리 시스템입니다. MongoDB를 사용하여 블로그 포스트를 관리하고, JWT 인증을 통해 보안을 제공합니다.

### 기술 스택

- **프레임워크**: NestJS 11.0.0
- **데이터베이스**: MongoDB (Mongoose ODM)
- **인증**: JWT (JSON Web Token)
- **API 문서**: Swagger/OpenAPI 3.0
- **언어**: TypeScript
- **포트**: 3001

### 프로젝트 구조

```
src/
├── modules/post/          # 포스트 관련 모듈
│   ├── Controller/        # API 컨트롤러
│   ├── Service/          # 비즈니스 로직
│   ├── DTO/              # 데이터 전송 객체
│   └── schemas/          # MongoDB 스키마
├── utils/
│   ├── Authorization/    # JWT 인증 관련
│   ├── Api/             # 외부 API 클라이언트
│   ├── Mapper/          # 데이터 매핑
│   └── pagination/      # 페이지네이션
└── config/              # 설정 파일
```

## 인증

### JWT 토큰 인증

모든 보호된 엔드포인트는 JWT 토큰을 통한 인증이 필요합니다.

**헤더 형식:**
```
Authorization: Bearer <JWT_TOKEN>
```

**권한 레벨:**
- `admin`: 관리자 권한 (포스트 생성, 수정, 삭제)
- `user`: 일반 사용자 권한 (포스트 조회)

### 토큰 에러 처리

| 에러 코드 | 설명 |
|-----------|------|
| `NO_AUTH_HEADER` | Authorization 헤더가 없음 |
| `INVALID_TOKEN_FORMAT` | 잘못된 토큰 형식 |
| `INVALID_TOKEN` | 유효하지 않은 토큰 |
| `TOKEN_EXPIRED` | 만료된 토큰 |

## API 엔드포인트

### 베이스 URL

```
http://localhost:3001
```

### Swagger 문서

API 문서는 다음 URL에서 확인할 수 있습니다:

```
http://localhost:3001/api/posts/swagger
```

## 포스트 API

### 데이터 모델

#### Post 스키마

```typescript
{
  _id: ObjectId,              // MongoDB 고유 ID
  title: string,              // 포스트 제목
  topic: string,              // 포스트 주제
  description: string,        // 포스트 설명
  content: Object,            // 포스트 본문 (JSON 형태)
  theme: string,              // 테마 (예: 'nest.js', 'react')
  category: string,           // 카테고리 (예: 'introduction', 'tutorial')
  authorEmail: string,        // 작성자 이메일
  tags: string[],             // 태그 배열
  viewCount: number,          // 조회수
  likeCount: number,          // 좋아요 수
  thumbnail?: string,         // 썸네일 이미지
  language: string,           // 언어 (기본값: 'ko')
  createdAt: Date,            // 생성일
  updatedAt: Date             // 수정일
}
```

### 엔드포인트 목록

| 메소드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| `POST` | `/api/v1/posts` | 포스트 생성 | admin |
| `GET` | `/api/v1/posts` | 포스트 목록 조회 | 공개 |
| `GET` | `/api/v1/posts/:id` | 포스트 상세 조회 | 공개 |
| `GET` | `/api/v1/posts/:id/edit` | 포스트 수정용 조회 | 작성자 |
| `PATCH` | `/api/v1/posts/:id` | 포스트 수정 | 작성자 |
| `DELETE` | `/api/v1/posts/:id` | 포스트 삭제 | admin |

---

## 1. 포스트 생성

새로운 포스트를 생성합니다.

### 요청

```http
POST /api/v1/posts
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 요청 본문

```json
{
  "title": "포스트 제목",
  "topic": "포스트 주제",
  "description": "포스트 설명",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "포스트 본문 내용"
          }
        ]
      }
    ]
  },
  "theme": "nest.js",
  "category": "introduction",
  "tags": ["NestJS", "Backend", "API"],
  "thumbnail": "thumbnail.jpg",
  "language": "ko"
}
```

### 응답

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "포스트 제목",
  "topic": "포스트 주제",
  "description": "포스트 설명",
  "content": { /* 포스트 본문 */ },
  "theme": "nest.js",
  "category": "introduction",
  "authorEmail": "admin@example.com",
  "author": "관리자",
  "tags": ["NestJS", "Backend", "API"],
  "viewCount": 0,
  "likeCount": 0,
  "thumbnail": "thumbnail.jpg",
  "language": "ko",
  "createdAt": "2025. 1. 21. 오후 2:30:15",
  "updatedAt": "2025. 1. 21. 오후 2:30:15"
}
```

---

## 2. 포스트 목록 조회

페이지네이션과 필터링이 적용된 포스트 목록을 조회합니다.

### 요청

```http
GET /api/v1/posts?theme=nest.js&category=introduction&page=1&limit=10
```

### 쿼리 파라미터

| 파라미터 | 타입 | 설명 | 기본값 |
|----------|------|------|--------|
| `theme` | string | 필터링할 테마 | - |
| `category` | string | 필터링할 카테고리 | - |
| `page` | number | 페이지 번호 | 1 |
| `limit` | number | 페이지당 항목 수 | 10 |

### 응답

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "포스트 제목",
      "topic": "포스트 주제",
      "description": "포스트 설명",
      "theme": "nest.js",
      "category": "introduction",
      "authorEmail": "admin@example.com",
      "author": "관리자",
      "tags": ["NestJS", "Backend"],
      "viewCount": 42,
      "likeCount": 5,
      "thumbnail": "thumbnail.jpg",
      "language": "ko",
      "createdAt": "2025. 1. 20. 오후 3:15:30",
      "updatedAt": "2025. 1. 21. 오전 10:20:45"
    }
  ],
  "meta": {
    "totalItems": 25,
    "currentPage": 1,
    "totalPages": 3,
    "itemsPerPage": 10
  }
}
```

---

## 3. 포스트 상세 조회

특정 포스트의 상세 정보를 조회합니다. 조회 시 `viewCount`가 자동으로 증가합니다.

### 요청

```http
GET /api/v1/posts/:id
```

### 헤더 (선택사항)

```http
x-viewed: true  // 조회수 증가를 방지하려면 설정
```

### 응답

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "포스트 제목",
  "topic": "포스트 주제",
  "description": "포스트 설명",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "포스트 본문 내용"
          }
        ]
      }
    ]
  },
  "theme": "nest.js",
  "category": "introduction",
  "authorEmail": "admin@example.com",
  "author": "관리자",
  "tags": ["NestJS", "Backend"],
  "viewCount": 43,
  "likeCount": 5,
  "thumbnail": "thumbnail.jpg",
  "language": "ko",
  "createdAt": "2025. 1. 20. 오후 3:15:30",
  "updatedAt": "2025. 1. 21. 오전 10:20:45"
}
```

---

## 4. 포스트 수정용 조회

포스트 수정을 위한 조회입니다. 작성자 권한이 필요합니다.

### 요청

```http
GET /api/v1/posts/:id/edit
Authorization: Bearer <JWT_TOKEN>
```

### 응답

포스트 상세 조회와 동일한 응답 형식입니다.

---

## 5. 포스트 수정

기존 포스트를 수정합니다. 작성자 권한이 필요합니다.

### 요청

```http
PATCH /api/v1/posts/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 요청 본문 (부분 업데이트 가능)

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "tags": ["수정된태그"]
}
```

### 응답

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "수정된 제목",
  "topic": "포스트 주제",
  "description": "수정된 설명",
  "content": { /* 기존 본문 */ },
  "theme": "nest.js",
  "category": "introduction",
  "authorEmail": "admin@example.com",
  "author": "관리자",
  "tags": ["수정된태그"],
  "viewCount": 43,
  "likeCount": 5,
  "thumbnail": "thumbnail.jpg",
  "language": "ko",
  "createdAt": "2025. 1. 20. 오후 3:15:30",
  "updatedAt": "2025. 1. 21. 오후 4:20:15"
}
```

---

## 6. 포스트 삭제

포스트를 삭제합니다. 관리자 권한이 필요합니다.

### 요청

```http
DELETE /api/v1/posts/:id
Authorization: Bearer <JWT_TOKEN>
```

### 응답

```http
204 No Content
```

## 에러 처리

### HTTP 상태 코드

| 상태 코드 | 설명 |
|-----------|------|
| `200` | 성공 |
| `201` | 생성 성공 |
| `204` | 성공 (본문 없음) |
| `400` | 잘못된 요청 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `404` | 리소스 없음 |
| `500` | 서버 오류 |

### 에러 응답 형식

```json
{
  "message": "에러 메시지",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "details": "추가 상세 정보"
}
```

### 공통 에러 케이스

#### 잘못된 MongoDB ObjectId

```json
{
  "message": "Invalid post ID: invalid-id",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### 포스트 없음

```json
{
  "message": "Post with ID 507f1f77bcf86cd799439011 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

#### 권한 없음

```json
{
  "message": "이 게시글을 수정할 권한이 없습니다.",
  "error": "Forbidden",
  "statusCode": 403
}
```

## 개발 환경 설정

### 환경 변수

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/vans-blog
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 서버 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod

# 빌드
npm run build
```

### 테스트 실행

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 커버리지 테스트
npm run test:cov
```

## 추가 정보

### 페이지네이션 메타데이터

```typescript
interface PaginationMeta {
  totalItems: number;      // 전체 항목 수
  currentPage: number;     // 현재 페이지
  totalPages: number;      // 전체 페이지 수
  itemsPerPage: number;    // 페이지당 항목 수
}
```

### 외부 API 연동

시스템은 내부 API 클라이언트를 통해 사용자 닉네임을 조회합니다:

```typescript
// 작성자 이메일 → 닉네임 변환
const authorNickname = await this.apiClient.getUserNickname(authorEmail);
```

### 데이터 유효성 검사

- 제목: 1-100자 제한
- 설명: 최대 500자 제한  
- 주제: 최대 200자 제한
- 페이지: 1 이상
- 제한: 1 이상

### 보안 고려사항

1. **JWT 토큰 검증**: 모든 보호된 엔드포인트에서 토큰 유효성 검사
2. **역할 기반 접근**: 관리자/사용자 권한 구분
3. **작성자 권한**: 포스트 수정 시 작성자 본인만 수정 가능
4. **입력 값 검증**: DTO와 ValidationPipe를 통한 입력 값 검증
5. **CORS 설정**: 허용된 오리진에서만 접근 가능

---

*이 문서는 VansDevBlog API v1.0 기준으로 작성되었습니다.* 