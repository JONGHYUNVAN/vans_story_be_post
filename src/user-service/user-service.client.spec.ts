/**
 * UserServiceClient 단위 테스트
 *
 * 같은 이메일의 조회를 한 번으로 묶고, 성공한 결과만 재사용하며, 실패를 로그로 남기는지 확인합니다.
 */
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, of, throwError } from 'rxjs';
import { UserServiceClient } from './user-service.client';

const USER_SERVICE_URL = 'https://users.example.com';
const INTERNAL_API_KEY = 'internal-key';
const EMAIL = 'author@example.com';
const NICKNAME = 'author';
const CACHE_TTL_MS = 5 * 60 * 1000;

const nicknameResponse = (nickname: string): Observable<unknown> =>
  of({ data: { data: nickname } });

const createMockHttpService = () => ({
  get: jest.fn(() => nicknameResponse(NICKNAME)),
});

describe('UserServiceClient', () => {
  let mockHttpService: ReturnType<typeof createMockHttpService>;
  let warnSpy: jest.SpyInstance;
  let client: UserServiceClient;

  beforeEach(() => {
    mockHttpService = createMockHttpService();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const env: Record<string, string> = { USER_SERVICE_URL, INTERNAL_API_KEY };
    client = new UserServiceClient(
      mockHttpService as unknown as HttpService,
      { getOrThrow: (key: string) => env[key] } as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('내부 키와 타임아웃을 넣어 사용자 서비스를 호출하고 닉네임을 돌려준다', async () => {
    await expect(client.getNicknameByEmail(EMAIL)).resolves.toBe(NICKNAME);

    expect(mockHttpService.get).toHaveBeenCalledWith(
      `${USER_SERVICE_URL}/api/v1/users/email/${EMAIL}`,
      { headers: { 'X-API-KEY': INTERNAL_API_KEY }, timeout: 3000 },
    );
  });

  it('같은 이메일을 동시에 조회하면 한 번만 호출한다', async () => {
    const nicknames = await Promise.all(
      Array.from({ length: 15 }, () => client.getNicknameByEmail(EMAIL)),
    );

    expect(nicknames).toEqual(Array(15).fill(NICKNAME));
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('이메일이 다르면 따로 조회한다', async () => {
    mockHttpService.get
      .mockReturnValueOnce(nicknameResponse('first'))
      .mockReturnValueOnce(nicknameResponse('second'));

    await expect(client.getNicknameByEmail('first@example.com')).resolves.toBe(
      'first',
    );
    await expect(client.getNicknameByEmail('second@example.com')).resolves.toBe(
      'second',
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(2);
  });

  it('성공한 결과는 재사용 시간 동안 쓰고 지나면 다시 조회한다', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0);
    await client.getNicknameByEmail(EMAIL);

    now.mockReturnValue(CACHE_TTL_MS - 1);
    await client.getNicknameByEmail(EMAIL);
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);

    now.mockReturnValue(CACHE_TTL_MS);
    await client.getNicknameByEmail(EMAIL);
    expect(mockHttpService.get).toHaveBeenCalledTimes(2);
  });

  it('실패하면 동시 호출 모두 null을 받고 다음 조회에서 다시 호출한다', async () => {
    mockHttpService.get.mockReturnValueOnce(
      throwError(() => ({ code: 'ECONNABORTED' })),
    );

    await expect(
      Promise.all([
        client.getNicknameByEmail(EMAIL),
        client.getNicknameByEmail(EMAIL),
      ]),
    ).resolves.toEqual([null, null]);
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);

    await expect(client.getNicknameByEmail(EMAIL)).resolves.toBe(NICKNAME);
    expect(mockHttpService.get).toHaveBeenCalledTimes(2);
  });

  it('응답에 닉네임이 없으면 실패로 보고 재사용하지 않는다', async () => {
    mockHttpService.get.mockReturnValueOnce(of({ data: {} }));

    await expect(client.getNicknameByEmail(EMAIL)).resolves.toBeNull();
    await expect(client.getNicknameByEmail(EMAIL)).resolves.toBe(NICKNAME);
  });

  it('실패 로그에는 코드와 상태만 남기고 URL·이메일·키를 넣지 않는다', async () => {
    mockHttpService.get.mockReturnValueOnce(
      throwError(() => ({
        code: 'ERR_BAD_REQUEST',
        message: `failed ${USER_SERVICE_URL}/api/v1/users/email/${EMAIL}`,
        response: { status: 403 },
        config: { headers: { 'X-API-KEY': INTERNAL_API_KEY } },
      })),
    );

    await client.getNicknameByEmail(EMAIL);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain('ERR_BAD_REQUEST');
    expect(message).toContain('403');
    expect(message).not.toContain(USER_SERVICE_URL);
    expect(message).not.toContain(EMAIL);
    expect(message).not.toContain(INTERNAL_API_KEY);
  });
});
