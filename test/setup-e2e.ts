// e2e는 .env의 MONGODB_URI에서 DB 이름 뒤에 _test를 붙인 테스트 DB를 쓴다 (jest-e2e.json setupFiles)
import { resolve } from 'node:path';

process.loadEnvFile(resolve(__dirname, '../.env'));
process.env.MONGODB_URI = process.env.MONGODB_URI!.replace(
  /\/([^/?]+)(\?|$)/,
  '/$1_test$2',
);
