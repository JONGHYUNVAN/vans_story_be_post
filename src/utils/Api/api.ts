/**
 * 내부 API 클라이언트 모듈
 * 
 * 다른 마이크로서비스와의 통신을 위한 HTTP 클라이언트를 제공합니다.
 * 
 * @module utils/Api/api
 */

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 내부 API 통신을 위한 유틸리티 클래스
 * 
 * 다른 내부 서비스와의 HTTP 통신을 처리합니다.
 */
@Injectable()
export class InternalApiClient {
  /**
   * 사용자 서비스 기본 URL
   */
  private readonly userServiceUrl: string;
  
  /**
   * 내부 API 호출을 위한 인증 키
   */
  private readonly apiKey: string;

  /**
   * InternalApiClient 생성자
   * 
   * `ConfigService`에서 설정을 읽습니다. 값의 존재·형식은 기동 시 `validateEnv`가 검증합니다.
   *
   * @param {HttpService} httpService - HTTP 요청을 처리하기 위한 NestJS HTTP 서비스
   * @param {ConfigService} config - 환경 변수
   * @throws {Error} 필수 환경 변수가 정의되지 않은 경우
   */
  constructor(
    private readonly httpService: HttpService,
    config: ConfigService,
  ) {
    this.userServiceUrl = config.getOrThrow<string>('USER_SERVICE_URL');
    this.apiKey = config.getOrThrow<string>('INTERNAL_API_KEY');
  }

  /**
   * 사용자 닉네임을 조회합니다.
   * 
   * @param {string} email - 조회할 사용자의 이메일
   * @returns {Promise<string | null>} 사용자 닉네임 또는 null
   */
  async getUserNickname(email: string): Promise<string | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/api/v1/users/email/${email}`,
          {
            headers: {
              'X-API-KEY': this.apiKey,
            },
            timeout: 1000, // 1초 타임아웃 추가
          }
        )
      );
      return data.data;
    } catch (error) {
      // 에러 발생 시 로그 없이 null 반환 (성능 개선)
      return null;
    }
  }
}
