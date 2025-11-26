const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

console.log('🔍 اختبار اتصال R2...\n');

// عرض معلومات الإعدادات
console.log('📋 الإعدادات الحالية:');
console.log(`   R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
console.log(`   R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID}`);
console.log(`   R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);
console.log(`   R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL}`);
console.log(`   R2_ACCESS_KEY_ID length: ${process.env.R2_ACCESS_KEY_ID?.length || 0} characters`);
console.log(`   R2_SECRET_ACCESS_KEY length: ${process.env.R2_SECRET_ACCESS_KEY?.length || 0} characters\n`);

// التحقق من طول المفاتيح
if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.length < 20) {
  console.log('❌ خطأ: R2_ACCESS_KEY_ID قصير جداً!');
  console.log('💡 المفتاح الحالي: ' + process.env.R2_ACCESS_KEY_ID);
  console.log('💡 يجب أن يكون طول المفتاح حوالي 32 حرف (بدون نجوم ****)');
  console.log('📖 راجع ملف FIX_R2_KEYS.md لمعرفة كيفية الحصول على المفاتيح الكاملة\n');
  process.exit(1);
}

if (!process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY.length < 30) {
  console.log('❌ خطأ: R2_SECRET_ACCESS_KEY قصير جداً!');
  console.log('💡 المفتاح الحالي: ' + process.env.R2_SECRET_ACCESS_KEY);
  console.log('💡 يجب أن يكون طول المفتاح حوالي 43 حرف (بدون نجوم ****)');
  console.log('📖 راجع ملف FIX_R2_KEYS.md لمعرفة كيفية الحصول على المفاتيح الكاملة\n');
  process.exit(1);
}

// محاولة الاتصال
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function testConnection() {
  try {
    console.log('🔄 جاري الاتصال بـ R2...');
    
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('\n✅ ✅ ✅ نجح الاتصال بـ R2! ✅ ✅ ✅\n');
    console.log('📦 Buckets المتاحة:');
    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name}`);
      });
    } else {
      console.log('   (لا توجد buckets)');
    }
    
    console.log('\n🎉 المفاتيح صحيحة ويمكنك الآن رفع الملفات!\n');
    
  } catch (error) {
    console.log('\n❌ ❌ ❌ فشل الاتصال بـ R2! ❌ ❌ ❌\n');
    console.log('📋 تفاصيل الخطأ:');
    console.log(`   الرسالة: ${error.message}`);
    if (error.Code) {
      console.log(`   الكود: ${error.Code}`);
    }
    
    console.log('\n💡 الحلول المحتملة:');
    console.log('   1. تأكد من أن المفاتيح صحيحة وكاملة (بدون ****)');
    console.log('   2. تأكد من أن R2_ENDPOINT صحيح');
    console.log('   3. أنشئ API Token جديد من Cloudflare Dashboard');
    console.log('   4. راجع ملف FIX_R2_KEYS.md للتعليمات الكاملة\n');
    
    process.exit(1);
  }
}

testConnection();
