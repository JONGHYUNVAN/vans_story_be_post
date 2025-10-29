# 카테고리 마이그레이션 가이드

## 개요

`vans_story`에 raw code 형태로 정의되어 있던 카테고리 정보를 `vans_story_be_post`의 MongoDB 스키마로 마이그레이션하는 가이드입니다.

## 마이그레이션 내용

### 기존 구조 (vans_story)
- 파일 위치: `vans_story/src/interfaces/post/categories.ts`
- 형태: TypeScript 객체로 하드코딩된 카테고리 정보
- 문제점: 동적 관리 불가, 확장성 부족

### 새로운 구조 (vans_story_be_post)
- MongoDB 컬렉션: `categories`
- 동적 CRUD 연산 지원
- RESTful API 제공
- 계층적 카테고리 구조 (메인 카테고리 + 서브 카테고리)

## 스키마 구조

### Category Entity
```typescript
{
  group: string;           // 카테고리 그룹 (Frontend, Backend, Database, IT, Test, Etc)
  value: string;           // 카테고리 값 (URL 키)
  label: string;           // 카테고리 표시명
  description?: string;    // 카테고리 설명
  iconName: string;        // 아이콘 이름 (React Icons)
  color: string;           // 아이콘 색상 (HEX)
  path: string;            // 카테고리 경로
  subCategories: SubCategory[]; // 서브 카테고리 목록
  isActive: boolean;       // 활성화 여부
  sortOrder: number;       // 정렬 순서
  createdAt: Date;         // 생성일시
  updatedAt: Date;         // 수정일시
}
```

### SubCategory Schema
```typescript
{
  value: string;           // 서브 카테고리 값
  label: string;           // 서브 카테고리 표시명
  description?: string;    // 서브 카테고리 설명
}
```

## 마이그레이션 실행

### 1. 환경 설정
```bash
# MongoDB 연결 문자열 설정 (.env 파일)
MONGODB_URI=mongodb://localhost:27017/vans_devblog
```

### 2. 마이그레이션 스크립트 실행
```bash
# 카테고리 데이터 마이그레이션
npm run migrate:categories
```

### 3. 마이그레이션 확인
```bash
# 애플리케이션 실행
npm run start:dev

# API 테스트
curl http://localhost:3001/categories
curl http://localhost:3001/categories/grouped
```

## API 엔드포인트

### 공개 엔드포인트
- `GET /categories` - 모든 카테고리 조회
- `GET /categories/grouped` - 그룹별 카테고리 조회
- `GET /categories/:id` - 특정 카테고리 조회
- `GET /categories/value/:value` - 값으로 카테고리 조회

### 인증 필요 엔드포인트 (관리자)
- `POST /categories` - 카테고리 생성
- `PATCH /categories/:id` - 카테고리 수정
- `DELETE /categories/:id` - 카테고리 삭제
- `PATCH /categories/:id/activate` - 카테고리 활성화
- `PATCH /categories/:id/deactivate` - 카테고리 비활성화

## 마이그레이션된 카테고리 목록

### Frontend
- **Next.js** (`nextjs`)
  - 소개, 설치, 라우팅, API 라우트, SSR/SSG, 배포

### Backend
- **NestJS** (`nestjs`)
  - 소개, 설치, 모듈, 컨트롤러, 서비스, 데이터베이스, 인증, 테스팅
- **Spring** (`spring`)
  - 소개, Spring Boot, Spring MVC, Spring Data JPA, Spring Security, 테스팅

### Database
- **Database Theory** (`database-theory`)
  - 기초 이론, 정규화, 인덱싱, 트랜잭션, 최적화
- **MariaDB** (`mariadb`)
  - 설치, 기본 쿼리, 고급 쿼리, 성능 최적화, 백업/복구
- **MongoDB** (`mongodb`)
  - 소개, 설치, CRUD 연산, 집계, 인덱싱, 복제

### IT
- **Docker** (`docker`)
  - 소개, 설치, Dockerfile, Docker Compose, 네트워킹, 볼륨
- **JWT** (`jwt`)
  - 소개, 구조, 구현, 보안, 모범 사례

### Test
- **Jest** (`jest`)
  - 소개, 설정, 단위 테스트, 모킹, 커버리지
- **Cypress** (`cypress`)
  - 소개, 설치, 테스트 작성, 커맨드, 모범 사례
- **JUnit5** (`junit5`)
  - 소개, 어노테이션, 단언문, 매개변수 테스트, 확장

### Etc
- **Git** (`git`)
  - 소개, 기본 명령어, 브랜칭, 병합, 협업, 워크플로우
- **Algorithm** (`algorithm`)
  - 자료구조, 정렬, 탐색, 그래프, 동적 계획법, 탐욕법

## 주의사항

1. **데이터 백업**: 마이그레이션 전 기존 데이터를 백업하세요.
2. **환경 변수**: `MONGODB_URI`가 올바르게 설정되어 있는지 확인하세요.
3. **권한 관리**: 카테고리 생성/수정/삭제는 관리자 권한이 필요합니다.
4. **API 문서**: Swagger 문서에서 상세한 API 스펙을 확인할 수 있습니다.

## 트러블슈팅

### MongoDB 연결 오류
```bash
# MongoDB 서비스 상태 확인
sudo systemctl status mongod

# MongoDB 서비스 시작
sudo systemctl start mongod
```

### 마이그레이션 실패
```bash
# 기존 categories 컬렉션 삭제 후 재시도
mongo
> use vans_devblog
> db.categories.drop()
> exit

npm run migrate:categories
```

## 다음 단계

1. **프론트엔드 연동**: `vans_story`에서 새로운 API를 사용하도록 수정
2. **캐싱 구현**: 자주 조회되는 카테고리 데이터 캐싱
3. **검색 기능**: 카테고리 기반 포스트 검색 기능 구현
4. **관리자 페이지**: 카테고리 관리를 위한 관리자 인터페이스 구현

