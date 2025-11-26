const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');
require('dotenv').config();

// إعداد اتصال R2
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // مهم لـ R2
});

// إعداد اتصال قاعدة البيانات
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function deleteAllR2Content() {
  console.log('🗑️  بدء حذف محتويات R2...');
  
  try {
    let continuationToken = undefined;
    let totalDeleted = 0;

    do {
      // الحصول على قائمة الملفات
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const listResponse = await s3Client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // حذف الملفات
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: {
            Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })),
            Quiet: false,
          },
        });

        const deleteResponse = await s3Client.send(deleteCommand);
        const deletedCount = deleteResponse.Deleted?.length || 0;
        totalDeleted += deletedCount;

        console.log(`✅ تم حذف ${deletedCount} ملف من R2`);
      }

      continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log(`✅ تم حذف إجمالي ${totalDeleted} ملف من R2`);
    return totalDeleted;
  } catch (error) {
    console.error('❌ خطأ في حذف محتويات R2:', error);
    throw error;
  }
}

async function deleteContentFromDatabase() {
  console.log('🗑️  بدء حذف بيانات المحتوى من قاعدة البيانات...');
  
  try {
    await dbClient.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // حذف جميع السجلات من جدول content فقط
    const result = await dbClient.query('DELETE FROM content');
    const deletedCount = result.rowCount;

    console.log(`✅ تم حذف ${deletedCount} سجل من جدول content`);
    
    // إعادة تعيين sequence للـ ID
    await dbClient.query('ALTER SEQUENCE content_id_seq RESTART WITH 1');
    console.log('✅ تم إعادة تعيين sequence للـ ID');

    return deletedCount;
  } catch (error) {
    console.error('❌ خطأ في حذف بيانات المحتوى:', error);
    throw error;
  } finally {
    await dbClient.end();
    console.log('✅ تم إغلاق اتصال قاعدة البيانات');
  }
}

async function main() {
  console.log('🚀 بدء عملية التنظيف الشاملة...\n');
  
  try {
    // حذف محتويات R2
    const r2DeletedCount = await deleteAllR2Content();
    console.log('');

    // حذف بيانات المحتوى من قاعدة البيانات
    const dbDeletedCount = await deleteContentFromDatabase();
    console.log('');

    console.log('✅ ✅ ✅ اكتملت عملية التنظيف بنجاح! ✅ ✅ ✅');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - ملفات R2 المحذوفة: ${r2DeletedCount}`);
    console.log(`   - سجلات قاعدة البيانات المحذوفة: ${dbDeletedCount}`);
    console.log(`   - بيانات المؤدين: محفوظة ✅`);
    console.log(`   - بيانات الفئات: محفوظة ✅`);
    console.log(`   - بيانات المسؤولين: محفوظة ✅`);
    
  } catch (error) {
    console.error('❌ فشلت عملية التنظيف:', error.message);
    process.exit(1);
  }
}

// تشغيل السكربت
main();
