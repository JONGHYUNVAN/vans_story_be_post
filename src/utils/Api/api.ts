import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';

/**
 * 내부 API 통신을 위한 유틸리티 클래스
 * 
 * @class InternalApiClient
 * @description 다른 내부 서비스와의 HTTP 통신을 처리합니다.
 */
@Injectable()
export class InternalApiClient {
  private readonly userServiceUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
  ) {
    this.userServiceUrl = process.env.USER_SERVICE_URL;
    this.apiKey = process.env.INTERNAL_API_KEY;

    if (!this.apiKey || !this.userServiceUrl) {
      throw new Error('Required environment variables are not defined');
    }
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
            }
          }
        )
      );
      return data.data;
    } catch (error) {
      console.error(`Failed to fetch nickname for ${email}:`, error.message);
      return null;  // 에러 시 null 반환
    }
  }
}
