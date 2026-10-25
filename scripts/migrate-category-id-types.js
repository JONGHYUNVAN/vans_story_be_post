/**
 * 문자열로 저장된 카테고리 참조를 ObjectId로 바꾼다.
 *
 * 2026-10-25: `@Prop({ type: Types.ObjectId })`가 @nestjs/mongoose 12에서 `Mixed`로 해석되어,
 * 그 사이 API로 만든 문서는 `posts.mainCategoryId` / `posts.subCategoryId` / `categories.parentId`가
 * 24자리 hex 문자열로 저장됐다. 스키마를 `SchemaTypes.ObjectId`로 고친 뒤 기존 문서를 이 스크립트로 되돌린다.
 *
 * 사용: MONGODB_URI=<uri> node scripts/migrate-category-id-types.js [--dry-run]
 * (Atlas는 허용된 IP에서만 접속된다. 절차는 docs/history/2026-10-25-category-id-types.md)
 */
const { MongoClient, ObjectId } = require('mongodb');

const TARGETS = [
  { collection: 'posts', fields: ['mainCategoryId', 'subCategoryId'] },
  { collection: 'categories', fields: ['parentId'] },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI 환경 변수가 필요합니다.');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    for (const { collection, fields } of TARGETS) {
      const col = db.collection(collection);
      for (const field of fields) {
        const docs = await col
          .find(
            { [field]: { $type: 'string' } },
            { projection: { [field]: 1 } },
          )
          .toArray();
        const convertible = docs.filter((doc) => ObjectId.isValid(doc[field]));
        const skipped = docs.length - convertible.length;
        console.log(
          `${collection}.${field}: 문자열 ${docs.length}건 (변환 대상 ${convertible.length}, 형식 오류 ${skipped})`,
        );
        if (dryRun || convertible.length === 0) continue;
        const ops = convertible.map((doc) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { [field]: new ObjectId(doc[field]) } },
          },
        }));
        const result = await col.bulkWrite(ops, { ordered: false });
        console.log(`${collection}.${field}: ${result.modifiedCount}건 변환`);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
