# 🔒 보안 정책 (Security Policy)

## 개요

VansDevBlog API는 다층 보안 구조를 통해 안전한 블로그 서비스를 제공합니다. 이 문서는 프로젝트의 보안 구성 요소와 정책을 설명합니다.

## 🛡️ 보안 아키텍처

### 보안 계층

```
┌─────────────────────────────────────────────┐
│                클라이언트                      │
└─────────────────────────────────────────────┘
                      │
                   HTTPS
                      │
┌─────────────────────────────────────────────┐
│              CORS 정책                      │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│         JWT 인증 & 권한 검증                 │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│          입력 값 검증 & 정화                 │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│            비즈니스 로직                     │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│          MongoDB 보안 연결                  │
└─────────────────────────────────────────────┘
```

## 🔐 인증 시스템

### JWT (JSON Web Token) 인증

#### 토큰 구조
```javascript
{
  "sub": "user@example.com",    // 사용자 이메일
  "auth": "admin",              // 권한 레벨
  "iat": 1516239022,            // 발급 시간
  "exp": 1516325422             // 만료 시간
}
```

#### 토큰 검증 과정
1. **토큰 추출**: `Authorization: Bearer <token>` 헤더에서 추출
2. **서명 검증**: JWT_SECRET을 이용한 서명 검증
3. **만료 검증**: 토큰 만료 시간 확인
4. **페이로드 검증**: 사용자 정보 추출 및 검증

#### 보안 설정
```typescript
// JWT 전략 설정
{
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,        // 만료 검증 활성화
  secretOrKey: Buffer.from(process.env.JWT_SECRET, 'base64')
}
```

### 인증 에러 처리

| 에러 코드 | 상태 코드 | 설명 | 대응 방안 |
|-----------|-----------|------|-----------|
| `NO_AUTH_HEADER` | 401 | Authorization 헤더 없음 | 헤더 포함하여 재요청 |
| `INVALID_TOKEN_FORMAT` | 401 | 잘못된 토큰 형식 | Bearer 스키마 확인 |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 | 새 토큰 발급 |
| `TOKEN_EXPIRED` | 401 | 만료된 토큰 | 토큰 재발급 |

## 🎯 권한 관리

### 역할 기반 접근 제어 (RBAC)

#### 권한 레벨
- **`admin`**: 관리자 권한 (포스트 생성, 수정, 삭제)
- **`user`**: 일반 사용자 권한 (포스트 조회)

#### 권한 설정 방법
```typescript
// 관리자 권한 필요
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post()
createPost() { /* ... */ }

// 인증만 필요
@UseGuards(JwtAuthGuard)
@Get(':id/edit')
getPostForEdit() { /* ... */ }
```

#### 권한 검증 흐름
1. **인증 확인**: JWT 토큰 검증
2. **역할 추출**: 토큰에서 사용자 역할 추출
3. **권한 검증**: 요구 권한과 사용자 권한 비교
4. **접근 허용/거부**: 검증 결과에 따른 접근 제어

### 리소스 소유권 검증

#### 작성자 권한 체크
```typescript
// 포스트 수정 시 작성자 확인
const post = await this.postModel.findById(id);
if (post.authorEmail !== userEmail) {
  throw new ForbiddenException('이 게시글을 수정할 권한이 없습니다.');
}
```

## 🌐 네트워크 보안

### CORS (Cross-Origin Resource Sharing) 설정

#### 보안 설정
```typescript
{
  origin: process.env.CORS_ORIGINS.split(','),  // 허용 도메인
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,                            // 인증 정보 허용
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  exposedHeaders: ['Authorization'],
  maxAge: 3600                                 // preflight 캐시 시간
}
```

#### 환경별 설정
```bash
# 개발 환경
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# 프로덕션 환경
CORS_ORIGINS=https://blog.yourdomain.com,https://admin.yourdomain.com
```

### API 엔드포인트 보안

#### 보호된 엔드포인트
| 엔드포인트 | 메소드 | 권한 | 추가 검증 |
|-----------|--------|------|-----------|
| `/api/v1/posts` | POST | admin | 입력값 검증 |
| `/api/v1/posts/:id` | PATCH | 작성자 | 소유권 검증 |
| `/api/v1/posts/:id` | DELETE | admin | - |
| `/api/v1/posts/:id/edit` | GET | 작성자 | 소유권 검증 |

#### 공개 엔드포인트
| 엔드포인트 | 메소드 | 제한 사항 |
|-----------|--------|-----------|
| `/api/v1/posts` | GET | 페이지네이션 제한 |
| `/api/v1/posts/:id` | GET | 조회수 증가 |

## 🔍 입력 값 검증

### 데이터 검증 정책

#### ValidationPipe 설정
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                    // DTO 외 속성 제거
  forbidNonWhitelisted: true,         // 허용되지 않은 속성 거부
  transform: true,                    // 자동 타입 변환
  transformOptions: {
    enableImplicitConversion: true
  }
}));
```

#### 입력 값 제한
| 필드 | 타입 | 제한 사항 |
|------|------|-----------|
| title | string | 1-100자 |
| description | string | 최대 500자 |
| topic | string | 최대 200자 |
| content | object | 필수 입력 |
| tags | string[] | 문자열 배열 |

### SQL/NoSQL 인젝션 방지

#### MongoDB 쿼리 보안
```typescript
// 안전한 쿼리 (Mongoose 사용)
const posts = await this.postModel.find({
  theme: sanitizedTheme,
  category: sanitizedCategory
});

// ObjectId 검증
if (!Types.ObjectId.isValid(id)) {
  throw new NotFoundException(`Invalid post ID: ${id}`);
}
```

## 🗄️ 데이터베이스 보안

### MongoDB 연결 보안

#### 연결 설정
```typescript
{
  uri: process.env.MONGODB_URI,
  directConnection: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  retryWrites: true
}
```

#### 보안 권고사항
1. **인증 활성화**: MongoDB 인증 활성화
2. **네트워크 격리**: 프라이빗 네트워크에서 접근
3. **연결 암호화**: TLS/SSL 연결 사용
4. **최소 권한 원칙**: 필요한 권한만 부여

### 데이터 보호

#### 민감 정보 처리
```typescript
// 사용자 정보 마스킹
const responseDto = mapToDto(post, ResponseDto);
responseDto.author = authorNickname;  // 이메일 대신 닉네임 사용
```

## 📚 API 문서 보안

### Swagger UI 보안

#### 인증 미들웨어
```typescript
// 세션 기반 인증
if (req.session.swaggerAuthorized) {
  return next();
}

// 비밀번호 인증
if (password === process.env.SWAGGER_ADMIN_PASSWORD) {
  req.session.swaggerAuthorized = true;
}
```

#### 접근 제어
- **인증 필요**: API 문서 접근 시 비밀번호 요구
- **세션 관리**: 세션 기반 인증 상태 유지
- **환경 변수**: 관리자 비밀번호 환경 변수 관리

## 🔧 환경 변수 보안

### 필수 보안 환경 변수

```bash
# JWT 관련
JWT_SECRET=base64-encoded-secret-key

# 데이터베이스
MONGODB_URI=mongodb://username:password@host:port/database

# CORS
CORS_ORIGINS=https://yourdomain.com

# Swagger 보안
SWAGGER_ADMIN_PASSWORD=strong-password

# 외부 API
USER_SERVICE_URL=https://api.yourdomain.com
```

### 환경 변수 관리 지침

1. **복잡한 비밀번호**: 최소 32자 이상의 복잡한 문자열
2. **정기적 갱신**: JWT_SECRET 정기적 변경
3. **환경별 분리**: 개발/스테이징/프로덕션 환경 분리
4. **버전 관리 제외**: `.gitignore`에 환경 파일 추가

## 🚨 보안 모니터링

### 로그 관리

#### 보안 이벤트 로깅
```typescript
// 인증 실패 로그
console.warn(`Authentication failed for IP: ${req.ip}`);

// 권한 위반 로그
console.warn(`Unauthorized access attempt: ${userEmail} to ${req.path}`);

// 비정상 요청 로그
console.error(`Invalid request detected: ${req.body}`);
```

#### 모니터링 대상
- 인증 실패 횟수
- 권한 위반 시도
- 비정상적인 요청 패턴
- 데이터베이스 연결 오류

## 🔄 보안 업데이트

### 의존성 관리

#### 정기적 업데이트
```bash
# 보안 취약점 검사
npm audit

# 자동 수정
npm audit fix

# 의존성 업데이트
npm update
```

#### 모니터링 도구
- **GitHub Security Alerts**: 자동 취약점 알림
- **npm audit**: 의존성 보안 검사
- **Snyk**: 보안 취약점 모니터링

## 🛠️ 보안 체크리스트

### 배포 전 점검사항

#### 인증 & 권한
- [ ] JWT_SECRET 환경 변수 설정 완료
- [ ] 토큰 만료 시간 적절히 설정
- [ ] 권한 기반 접근 제어 정상 작동
- [ ] 작성자 권한 검증 로직 확인

#### 네트워크 보안
- [ ] CORS 설정 적절히 구성
- [ ] HTTPS 적용 (프로덕션)
- [ ] 허용 도메인 목록 최신화

#### 데이터 보안
- [ ] 입력 값 검증 규칙 적용
- [ ] MongoDB 인증 활성화
- [ ] 민감 정보 마스킹 처리

#### API 문서
- [ ] Swagger UI 인증 활성화
- [ ] 관리자 비밀번호 설정
- [ ] 프로덕션 환경에서 접근 제한

#### 환경 설정
- [ ] 모든 환경 변수 설정 완료
- [ ] 환경별 설정 분리
- [ ] 민감 정보 Git 제외

## 🚫 보안 위반 시 대응

### 인시던트 대응 절차

1. **즉시 대응**
   - 의심스러운 활동 로그 수집
   - 영향받은 계정 비활성화
   - 관련 토큰 무효화

2. **조사 및 분석**
   - 공격 벡터 분석
   - 영향 범위 조사
   - 데이터 유출 여부 확인

3. **복구 및 강화**
   - 취약점 패치
   - 보안 정책 강화
   - 모니터링 시스템 개선

### 긴급 연락처

```bash
# 보안 담당자
SECURITY_CONTACT=security@yourdomain.com

# 개발팀 리드
DEV_LEAD_CONTACT=dev-lead@yourdomain.com
```

## 📋 보안 정책 변경 이력

| 날짜 | 버전 | 변경 사항 | 담당자 |
|------|------|-----------|--------|
| 2025-01-21 | 1.0 | 초기 보안 정책 수립 | 개발팀 |

---

**⚠️ 주의사항:**
- 이 문서의 보안 정책은 정기적으로 검토하고 업데이트해야 합니다.
- 새로운 보안 취약점이 발견되면 즉시 대응 계획을 수립하세요.
- 모든 팀원이 보안 정책을 숙지하고 준수해야 합니다.

**📞 보안 문의:**
보안 관련 문의사항이나 취약점 제보는 보안 담당자에게 연락하세요. 