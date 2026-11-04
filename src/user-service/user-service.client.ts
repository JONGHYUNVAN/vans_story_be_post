import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** 사용자 서비스 응답을 기다리는 시간 (ms) */
const NICKNAME_LOOKUP_TIMEOUT_MS = 3000;

/** 조회한 닉네임을 재사용하는 시간 (ms). 닉네임을 바꾸면 최대 이만큼 뒤에 반영된다 */
const NICKNAME_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Spring 사용자 서비스 클라이언트
 *
 * 작성자 닉네임 조회에만 쓴다. 인증 키는 검색 서비스와 같은 `INTERNAL_API_KEY`를 `X-API-KEY`로 보낸다.
 */
@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);

  /**
   * 사용자 서비스 기본 URL
   */
  private readonly userServiceUrl: string;

  /**
   * 내부 서비스 호출용 인증 키 (`INTERNAL_API_KEY`)
   */
  private readonly internalApiKey: string;

  /**
   * 이메일별 닉네임 조회. 진행 중이거나 성공한 조회만 담아 같은 이메일의 호출을 하나로 묶는다.
   * 키는 게시글의 작성자 이메일이라 작성자 수를 넘지 않는다.
   */
  private readonly nicknameLookups = new Map<string, { nickname: Promise<string | null>; expiresAt: number }>();

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
   * 같은 이메일을 동시에 조회하면 호출을 한 번만 보내고, 성공한 결과는 잠시 재사용합니다.
   * 실패한 결과는 재사용하지 않으므로 다음 조회에서 다시 호출합니다.
   *
   * @param {string} email - 조회할 사용자의 이메일
   * @returns {Promise<string | null>} 사용자 닉네임. 호출이 실패하면 `null`
   */
  async getNicknameByEmail(email: string): Promise<string | null> {
    const cached = this.nicknameLookups.get(email);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.nickname;
    }

    const nickname = this.fetchNickname(email);
    this.nicknameLookups.set(email, { nickname, expiresAt: Date.now() + NICKNAME_CACHE_TTL_MS });
    if ((await nickname) === null) {
      this.nicknameLookups.delete(email);
    }
    return nickname;
  }

  /**
   * 사용자 서비스에 닉네임을 요청합니다. 실패는 원인만 경고 로그로 남기고 `null`을 돌려줍니다.
   */
  private async fetchNickname(email: string): Promise<string | null> {
    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/api/v1/users/email/${email}`,
          {
            headers: {
              'X-API-KEY': this.internalApiKey,
            },
            timeout: NICKNAME_LOOKUP_TIMEOUT_MS,
          }
        )
      );
      return body.data ?? null;
    } catch (error) {
      // axios 메시지와 설정에는 URL·키가 들어갈 수 있어 코드와 상태만 남긴다
      const { code, response } = error as { code?: string; response?: { status?: number } };
      this.logger.warn(`Nickname lookup failed: code=${code}, status=${response?.status}`);
      return null;
    }
  }
}
