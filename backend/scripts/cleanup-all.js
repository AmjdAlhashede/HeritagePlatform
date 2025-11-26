const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');
require('dotenv').config();

console.log('🚀 بدء عملية التنظيف الشاملة...\n');

// التحقق من المفاتيح
console.log('🔍 التحقق من الإعدادات...');
console.log(`   R2_ACCESS_KEY_ID length: ${process.env.R2_ACCESS_KEY_ID?.length || 0} characters`);
console.log(`   R2_SECRET_ACCESS_KEY length: ${process.env.R2_SECRET_ACCESS_KEY?.length || 0} characters`);
console.log(`   R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME || 'غير موجود'}\n`);

if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.length < 20) {
  console.log('❌ خطأ: R2_ACCESS_KEY_ID قصير جداً أو غير موجود');
  console.log('💡 يجب أن يكون طول المفتاح حوالي 32 حرف');
  console.log('📖 راجع ملف GET_R2_KEYS.md لمعرفة كيفية الحصول على المفاتيح الكاملة\n');
  process.exit(1);
}

if (!process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY.length < 30) {
  console.log('❌ خطأ: R2_SECRET_ACCESS_KEY قصير جداً أو غير موجود');
  console.log('💡 يجب أن يكون طول المفتاح حوالي 43 حرف');
  console.log('📖 راجع ملف GET_R2_KEYS.md لمعرفة كيفية الحصول على المفاتيح الكاملة\n');
  process.exit(1);
}

// إعداد اتصال R2
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

// إعداد اتصال قاعدة البيانات
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function deleteContentFromDatabase() {
  console.log('🗑️  بدء حذف بيانات المحتوى من قاعدة البيانات...\n');
  
  try {
    await dbClient.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // عرض عدد السجلات قبل الحذف
    const countBefore = await dbClient.query('SELECT COUNT(*) FROM content');
    console.log(`📊 عدد الفيديوهات الحالية: ${countBefore.rows[0].count}`);
    
    if (countBefore.rows[0].count === '0') {
      console.log('ℹ️  لا توجد فيديوهات للحذف من قاعدة البيانات\n');
      return 0;
    }

    // حذف جميع السجلات من جدول content فقط
    const result = await dbClient.query('DELETE FROM content');
    const deletedCount = result.rowCount;

    console.log(`✅ تم حذف ${deletedCount} سجل من جدول content`);
    
    // إعادة تعيين sequence للـ ID (إذا كان موجوداً)
    try {
      await dbClient.query('ALTER SEQUENCE content_id_seq RESTART WITH 1');
      console.log('✅ تم إعادة تعيين sequence للـ ID');
    } catch (seqError) {
      console.log('ℹ️  لا يوجد sequence للإعادة');
    }

    // التحقق من الجداول الأخرى
    const performersCount = await dbClient.query('SELECT COUNT(*) FROM performer');
    const categoriesCount = await dbClient.query('SELECT COUNT(*) FROM category');

    console.log('\n📊 البيانات المحفوظة:');
    console.log(`   ✅ المؤدون: ${performersCount.rows[0].count} سجل`);
    console.log(`   ✅ الفئات: ${categoriesCount.rows[0].count} سجل\n`);

    return deletedCount;
  } catch (error) {
    console.error('❌ خطأ في حذف بيانات المحتوى:', error.message);
    throw error;
  } finally {
    await dbClient.end();
  }
}

async function deleteAllR2Content() {
  console.log('🗑️  بدء حذف محتويات R2...\n');
  
  try {
    let continuationToken = undefined;
    let totalDeleted = 0;
    let batchNumber = 0;

    do {
      batchNumber++;
      console.log(`📥 جلب دفعة ${batchNumber} من الملفات...`);

      // الحصول على قائمة الملفات
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const listResponse = await s3Client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        console.log(`📋 تم العثور على ${listResponse.Contents.length} ملف`);

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

        console.log(`✅ تم حذف ${deletedCount} ملف من الدفعة ${batchNumber}`);
        console.log(`📊 إجمالي المحذوف حتى الآن: ${totalDeleted}\n`);
      } else {
        console.log('ℹ️  لا توجد ملفات في هذه الدفعة\n');
      }

      continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : undefined;
    } while (continuationToken);

    return totalDeleted;
  } catch (error) {
    console.error('\n❌ خطأ في حذف محتويات R2:', error.message);
    if (error.Code) {
      console.error(`❌ رمز الخطأ: ${error.Code}`);
    }
    throw error;
  }
}

async function main() {
  try {
    // 1. حذف من قاعدة البيانات
    const dbDeletedCount = await deleteContentFromDatabase();

    // 2. حذف من R2
    const r2DeletedCount = await deleteAllR2Content();

    console.log('\n✅ ✅ ✅ اكتملت عملية التنظيف الشاملة بنجاح! ✅ ✅ ✅');
    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   🗄️  سجلات قاعدة البيانات المحذوفة: ${dbDeletedCount}`);
    console.log(`   📦 ملفات R2 المحذوفة: ${r2DeletedCount}`);
    console.log(`   ✅ بيانات المؤدين: محفوظة`);
    console.log(`   ✅ بيانات الفئات: محفوظة`);
    console.log(`   ✅ بيانات المسؤولين: محفوظة\n`);
    
  } catch (error) {
    console.error('\n❌ فشلت عملية التنظيف');
    process.exit(1);
  }
}

// تشغيل السكربت
main();
