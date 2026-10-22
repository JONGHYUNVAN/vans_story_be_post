import { Injectable } from '@nestjs/common';

@Injectable()
export class MockInternalApiClient {
  private mockNicknames: Map<string, string> = new Map([
    ['test@example.com', '테스트사용자'],
    ['admin@example.com', '관리자'],
  ]);

  async getUserNickname(email: string): Promise<string | null> {
    return this.mockNicknames.get(email) || null;
  }
} 