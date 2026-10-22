import { Injectable } from '@nestjs/common';

/** e2e용 `UserServiceClient` 대체. 정해진 이메일의 닉네임만 돌려준다 */
@Injectable()
export class FakeUserServiceClient {
  private readonly nicknamesByEmail = new Map<string, string>([
    ['author@example.com', '작성자'],
    ['admin@example.com', '관리자'],
  ]);

  async getNicknameByEmail(email: string): Promise<string | null> {
    return this.nicknamesByEmail.get(email) ?? null;
  }
}
