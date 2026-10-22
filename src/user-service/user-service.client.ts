import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Spring 사용자 서비스 클라이언트
 *
 * 작성자 닉네임 조회에만 쓴다. 인증 키는 검색 서비스와 같은 `INTERNAL_API_KEY`를 `X-API-KEY`로 보낸다.
 */
@Injectable()
export class UserServiceClient {
  /**
   * 사용자 서비스 기본 URL
   */
  private readonly userServiceUrl: string;

  /**
   * 내부 서비스 호출용 인증 키 (`INTERNAL_API_KEY`)
   */
  private readonly internalApiKey: string;

  /**
   * `ConfigService`에서 설정을 읽습니다. 값의 존재·형식은 기동 시 `validateEnv`가 검증합니다.
   *
   * @param {HttpService} httpService - HTTP 요청을 처리하기 위한 NestJS HTTP 서비스
   * @param {ConfigService} configService - 환경 변수
   * @throws {Error} 필수 환경 변수가 정의되지 않은 경우
   */
  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.userServiceUrl = configService.getOrThrow<string>('USER_SERVICE_URL');
    this.internalApiKey = configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  /**
   * 이메일로 사용자 닉네임을 조회합니다.
   *
   * @param {string} email - 조회할 사용자의 이메일
   * @returns {Promise<string | null>} 사용자 닉네임. 호출이 실패하면 `null`
   */
  async getNicknameByEmail(email: string): Promise<string | null> {
    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/api/v1/users/email/${email}`,
          {
            headers: {
              'X-API-KEY': this.internalApiKey,
            },
            timeout: 1000, // 1초 타임아웃 추가
          }
        )
      );
      return body.data;
    } catch (error) {
      // 에러 발생 시 로그 없이 null 반환 (성능 개선)
      return null;
    }
  }
}
