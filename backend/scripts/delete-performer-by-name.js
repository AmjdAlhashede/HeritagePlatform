const { Client } = require('pg');
const { S3Client, DeleteObjectsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

// إعداد اتصال قاعدة البيانات
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

async function deletePerformerByName(performerName) {
  console.log(`🔍 البحث عن المؤدي: ${performerName}\n`);
  
  try {
    await dbClient.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات\n');

    // البحث عن المؤدي
    const performerResult = await dbClient.query(
      `SELECT id, name, "shortName" FROM performers WHERE name ILIKE $1 OR "shortName" ILIKE $1`,
      [`%${performerName}%`]
    );

    if (performerResult.rows.length === 0) {
      console.log(`❌ لم يتم العثور على المؤدي: ${performerName}`);
      return;
    }

    const performer = performerResult.rows[0];
    console.log(`✅ تم العثور على المؤدي:`);
    console.log(`   ID: ${performer.id}`);
    console.log(`   الاسم: ${performer.name}`);
    console.log(`   الاسم المختصر: ${performer.shortName || 'غير موجود'}\n`);

    // جلب كل المحتوى المرتبط
    const contentResult = await dbClient.query(
      'SELECT id, title FROM content WHERE performer_id = $1',
      [performer.id]
    );

    const contentList = contentResult.rows;
    console.log(`📦 عدد المحتويات المرتبطة: ${contentList.length}\n`);

    if (contentList.length === 0) {
      console.log('ℹ️  لا يوجد محتوى مرتبط بهذا المؤدي\n');
    } else {
      console.log('📋 قائمة المحتويات:');
      contentList.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (ID: ${item.id})`);
      });
      console.log('');
    }

    // تأكيد الحذف
    console.log('⚠️  ⚠️  ⚠️  تحذير ⚠️  ⚠️  ⚠️');
    console.log('سيتم حذف:');
    console.log(`   - ${contentList.length} محتوى للمؤدي: ${performer.name}`);
    console.log(`   - جميع الملفات من R2`);
    console.log(`   - المؤدي نفسه لن يُحذف (سيبقى)`);
    console.log('هذا الإجراء لا يمكن التراجع عنه!\n');

    // حذف ملفات R2 لكل محتوى
    if (contentList.length > 0) {
      console.log('🗑️  بدء حذف الملفات من R2...\n');
      
      for (const content of contentList) {
        try {
          console.log(`🗑️  حذف ملفات: ${content.title}`);
          
          const folderPath = `content/${content.id}/`;
          
          // جلب جميع الملفات في المجلد
          const listCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Prefix: folderPath,
          });
          
          const listResponse = await s3Client.send(listCommand);
          
          if (listResponse.Contents && listResponse.Contents.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Delete: {
                Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })),
                Quiet: false,
              },
            });
            
            await s3Client.send(deleteCommand);
            console.log(`   ✅ تم حذف ${listResponse.Contents.length} ملف من R2`);
          } else {
            console.log(`   ℹ️  لا توجد ملفات في R2`);
          }
        } catch (error) {
          console.error(`   ❌ خطأ في حذف ملفات ${content.title}: ${error.message}`);
        }
      }
      console.log('');
    }

    // حذف المحتوى من قاعدة البيانات
    if (contentList.length > 0) {
      console.log('🗑️  حذف المحتوى من قاعدة البيانات...');
      const deleteContentResult = await dbClient.query(
        'DELETE FROM content WHERE performer_id = $1',
        [performer.id]
      );
      console.log(`✅ تم حذف ${deleteContentResult.rowCount} محتوى من قاعدة البيانات\n`);
    }

    console.log('✅ ✅ ✅ اكتملت عملية الحذف بنجاح! ✅ ✅ ✅');
    console.log('\n📊 الملخص:');
    console.log(`   - المؤدي: ${performer.name} (لم يُحذف - لا يزال موجوداً)`);
    console.log(`   - عدد المحتويات المحذوفة: ${contentList.length}`);
    console.log(`   - الملفات المحذوفة من R2: نعم`);

  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.message);
    throw error;
  } finally {
    await dbClient.end();
    console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكربت
const performerName = process.argv[2] || 'عبد السلام القحوم';

console.log('🚀 بدء سكربت حذف المؤدي\n');
console.log('═══════════════════════════════════════\n');

deletePerformerByName(performerName)
  .then(() => {
    console.log('\n🎉 تمت العملية بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية');
    process.exit(1);
  });
