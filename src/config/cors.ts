import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * 허용된 origin 목록을 환경 변수에서 가져옵니다.
 * CORS_ORIGINS 환경 변수에서 쉼표로 구분된 도메인 목록을 배열로 변환합니다.
 */
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']; 

/**
 * CORS(Cross-Origin Resource Sharing) 설정
 * 
 * 클라이언트의 크로스 오리진 요청에 대한 서버의 응답 동작을 설정합니다.
 * 보안을 위해 허용된 도메인, 메서드, 헤더만 접근을 허용합니다.
 */
export const corsConfig: CorsOptions = {
  /**
   * 허용할 출처 도메인 목록
   * 개발 환경과 프로덕션 환경의 허용 도메인을 지정합니다.
   */
  origin: allowedOrigins,

  /**
   * 허용할 HTTP 메서드
   * REST API에 필요한 메서드들을 지정합니다.
   */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  /**
   * 인증 정보 허용 여부
   * 쿠키, Authorization 헤더 등의 인증 정보 전송을 허용합니다.
   */
  credentials: true,

  /**
   * 허용할 요청 헤더
   * 클라이언트에서 전송할 수 있는 헤더를 지정합니다.
   */
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'Accept',
  ],

  /**
   * 클라이언트에 노출할 헤더
   * 클라이언트에서 접근할 수 있는 응답 헤더를 지정합니다.
   */
  exposedHeaders: ['Authorization'],

  /**
   * preflight 요청 캐시 시간
   * OPTIONS 요청의 캐시 유지 시간을 초 단위로 지정합니다.
   */
  maxAge: 3600,
};
