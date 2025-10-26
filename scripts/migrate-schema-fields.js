/**
 * MongoDB 스키마 필드명 마이그레이션 스크립트
 * 
 * theme -> mainCategory
 * category -> subCategory
 * 
 * 사용법:
 * node scripts/migrate-schema-fields.js
 */

const { MongoClient } = require('mongodb');

// MongoDB 연결 설정 (환경변수 또는 기본값 사용)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vans_story_posts';
const DATABASE_NAME = process.env.DATABASE_NAME || 'vans_story_posts';
const COLLECTION_NAME = 'posts';

async function migrateFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('MongoDB에 연결 중...');
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('마이그레이션 시작...');
    
    // 1. 현재 문서 수 확인
    const totalDocs = await collection.countDocuments({});
    console.log(`총 ${totalDocs}개의 문서를 마이그레이션합니다.`);
    
    // 2. theme 필드가 있는 문서들을 mainCategory로 변경
    const themeUpdateResult = await collection.updateMany(
      { theme: { $exists: true } },
      { 
        $rename: { theme: 'mainCategory' }
      }
    );
    
    console.log(`theme -> mainCategory: ${themeUpdateResult.modifiedCount}개 문서 업데이트됨`);
    
    // 3. category 필드가 있는 문서들을 subCategory로 변경
    const categoryUpdateResult = await collection.updateMany(
      { category: { $exists: true } },
      { 
        $rename: { category: 'subCategory' }
      }
    );
    
    console.log(`category -> subCategory: ${categoryUpdateResult.modifiedCount}개 문서 업데이트됨`);
    
    // 4. 마이그레이션 결과 확인
    const updatedDocs = await collection.find({
      $or: [
        { mainCategory: { $exists: true } },
        { subCategory: { $exists: true } }
      ]
    }).limit(5).toArray();
    
    console.log('\n마이그레이션 완료! 샘플 문서:');
    updatedDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc._id}`);
      console.log(`   mainCategory: ${doc.mainCategory}`);
      console.log(`   subCategory: ${doc.subCategory}`);
      console.log('');
    });
    
    // 5. 이전 필드가 남아있는지 확인
    const oldFieldsCount = await collection.countDocuments({
      $or: [
        { theme: { $exists: true } },
        { category: { $exists: true } }
      ]
    });
    
    if (oldFieldsCount > 0) {
      console.warn(`⚠️ 경고: ${oldFieldsCount}개 문서에 이전 필드명이 남아있습니다.`);
    } else {
      console.log('✅ 모든 필드가 성공적으로 마이그레이션되었습니다.');
    }
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateFields()
    .then(() => {
      console.log('마이그레이션이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateFields };
