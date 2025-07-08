# Vans Story Backend

## 프로젝트 소개
Vans Story 블로그의 백엔드 서버입니다. Kotlin과 Spring Boot를 사용하여 개발되었습니다.

## 주요 기능
- 사용자 인증 및 권한 관리 (JWT 기반)
- 사용자 관리 (CRUD)
- API 문서화 (Swagger/OpenAPI)
- 보안 설정 및 CORS 지원

## 기술 스택
- **Language**: Kotlin 1.9.22
- **Framework**: Spring Boot 3.5.0
- **Java Version**: 21
- **Database**: MariaDB (JetBrains Exposed ORM)
- **Authentication**: JWT (io.jsonwebtoken)
- **Documentation**: Dokka, SpringDoc OpenAPI
- **Testing**: Kotest, MockK
- **Build Tool**: Gradle 8.5

## 아키텍처

### 패키지 구조
```
src/main/kotlin/blog/vans_story_be/
├── config/                 # 설정 클래스들
│   ├── apiLogger/         # API 요청 로깅 설정
│   ├── cors/              # CORS 설정
│   ├── database/          # 데이터베이스 설정
│   ├── init/              # 초기 데이터 로더
│   ├── security/          # Spring Security 설정
│   └── swagger/           # Swagger/OpenAPI 설정
├── domain/                # 도메인별 패키지
│   ├── auth/              # 인증 도메인
│   │   ├── annotation/    # 커스텀 어노테이션
│   │   ├── aspect/        # AOP 관련
│   │   ├── controller/    # 인증 API 컨트롤러
│   │   ├── dto/           # 인증 관련 DTO
│   │   ├── jwt/           # JWT 관련 클래스
│   │   └── service/       # 인증 비즈니스 로직
│   ├── base/              # 기본 엔티티
│   └── user/              # 사용자 도메인
│       ├── controller/    # 사용자 API 컨트롤러
│       ├── dto/           # 사용자 관련 DTO
│       ├── entity/        # 사용자 엔티티
│       ├── mapper/        # 엔티티-DTO 매퍼
│       ├── repository/    # 데이터 접근 계층
│       └── service/       # 사용자 비즈니스 로직
├── global/                # 전역 설정 및 유틸리티
│   ├── exception/         # 예외 처리
│   ├── mapper/            # 제네릭 매퍼
│   └── response/          # API 응답 유틸리티
├── post/                  # 블로그 포스트 도메인 (개발 중)
└── VansStoryBeApplication.kt # 메인 애플리케이션 클래스
```

## 시작하기

### 필수 조건
- JDK 21
- Gradle 8.5+
- MariaDB

### 환경 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수를 설정합니다:

```env
# 데이터베이스
DB_URL=jdbc:mariadb://localhost:3306/your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT
VANS_BLOG_JWT_SECRET_KEY=your_jwt_secret_key_here
VANS_BLOG_JWT_ACCESS_TOKEN_VALIDITY=18000
VANS_BLOG_JWT_REFRESH_TOKEN_VALIDITY=604800

# 서버 설정
SERVER_PORT=8080
LOG_LEVEL=INFO
SHOW_SQL=false
GENERATE_DDL=true
```

### 실행 방법

#### 개발 환경
```bash
./gradlew bootRun
```

#### 테스트 실행
```bash
./gradlew test
```

#### 빌드
```bash
./gradlew build
```

#### JAR 파일 생성
```bash
./gradlew bootJar
# 생성된 파일: build/libs/vans-story-be.jar
```

## API 엔드포인트

### 인증 API (`/api/v1/auth`)
- `POST /login` - 사용자 로그인
- `POST /refresh` - 토큰 갱신
- `POST /logout` - 로그아웃

### 사용자 API (`/api/v1/users`)
- `GET /` - 사용자 목록 조회 (관리자만)
- `POST /` - 사용자 생성 (관리자만)
- `GET /{id}` - 특정 사용자 조회
- `GET /email/{email}` - 이메일로 닉네임 조회
- `PATCH /{id}` - 사용자 정보 수정
- `DELETE /{id}` - 사용자 삭제

## API 문서
서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## 개발 도구

### 코드 문서화
프로젝트는 Dokka를 사용하여 코드 문서화를 관리합니다:
```bash
./gradlew dokkaHtml
```

### 모니터링
Spring Boot Actuator가 활성화되어 있습니다:
- Health Check: http://localhost:8080/actuator/health
- Info: http://localhost:8080/actuator/info

## 배포

### CloudType 배포 최적화
프로젝트는 CloudType 512MB 환경에 최적화되어 있습니다:
- 메모리 사용량 최적화 (128MB-384MB)
- G1GC 사용
- 불필요한 파일 제외
- 실행 스크립트 자동 생성

```bash
./gradlew createStartScript
```

### 로깅
- 개발: INFO 레벨 (기본값)
- 프로덕션: INFO 레벨
- SQL 로깅 옵션 지원

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

