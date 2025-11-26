const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

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

async function deleteAllR2Content() {
  console.log('🗑️  بدء حذف محتويات R2...\n');
  
  // التحقق من المفاتيح
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('❌ مفاتيح R2 غير موجودة في ملف .env');
  }
  
  if (process.env.R2_ACCESS_KEY_ID.length < 20) {
    throw new Error('❌ مفتاح R2_ACCESS_KEY_ID قصير جداً. تأكد من وضع المفتاح الكامل في ملف .env');
  }

  console.log(`📦 Bucket: ${process.env.R2_BUCKET_NAME}`);
  console.log(`🔑 Access Key Length: ${process.env.R2_ACCESS_KEY_ID.length} characters`);
  console.log(`🔐 Secret Key Length: ${process.env.R2_SECRET_ACCESS_KEY.length} characters\n`);
  
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

    console.log(`\n✅ ✅ ✅ اكتمل حذف محتويات R2 بنجاح! ✅ ✅ ✅`);
    console.log(`📊 إجمالي الملفات المحذوفة: ${totalDeleted}`);
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
  console.log('🚀 بدء عملية حذف محتويات R2...\n');
  console.log('⚠️  ملاحظة: هذا السكربت يحذف فقط من R2');
  console.log('⚠️  لحذف من قاعدة البيانات، استخدم cleanup-database-only.js\n');
  
  try {
    const r2DeletedCount = await deleteAllR2Content();
    console.log(`\n🎉 تمت العملية بنجاح! تم حذف ${r2DeletedCount} ملف من R2`);
  } catch (error) {
    console.error('\n❌ فشلت عملية التنظيف');
    process.exit(1);
  }
}

// تشغيل السكربت
main();
