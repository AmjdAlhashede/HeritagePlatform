const { execSync } = require('child_process');
const path = require('path');

// تكوين
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
const TEST_URLS = [
  'https://twitter.com/IssaAllaith/status/1984933503692390478',
  'https://twitter.com/elonmusk/status/1234567890', // مثال آخر
];

console.log('🧪 اختبار جلب معلومات من Twitter/X\n');
console.log('📁 ملف Cookies:', COOKIES_PATH);
console.log('═══════════════════════════════════════\n');

// اختبار كل رابط
for (const url of TEST_URLS) {
  console.log(`\n🔍 اختبار: ${url}`);
  console.log('─────────────────────────────────────');
  
  try {
    // جلب المعلومات باستخدام yt-dlp
    const command = `yt-dlp --cookies "${COOKIES_PATH}" --dump-json --no-download "${url}"`;
    
    console.log('⏳ جاري جلب المعلومات...\n');
    
    const output = execSync(command, { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 
    });
    
    const data = JSON.parse(output);
    
    // عرض المعلومات المهمة
    console.log('✅ تم جلب المعلومات بنجاح!\n');
    console.log('📊 المعلومات:');
    console.log('  🆔 ID:', data.id);
    console.log('  📝 العنوان:', data.title || data.description?.substring(0, 100));
    console.log('  👤 الناشر:', data.uploader || data.channel);
    console.log('  ⏱️  المدة:', data.duration, 'ثانية');
    console.log('  📅 تاريخ النشر:', data.upload_date);
    console.log('  📅 تاريخ النشر (ISO):', data.timestamp ? new Date(data.timestamp * 1000).toISOString() : 'N/A');
    console.log('  👁️  المشاهدات:', data.view_count || 'N/A');
    console.log('  ❤️  الإعجابات:', data.like_count || 'N/A');
    console.log('  🔄 إعادة التغريد:', data.repost_count || 'N/A');
    console.log('  🖼️  الصورة المصغرة:', data.thumbnail?.substring(0, 80) + '...');
    
    // عرض كل الحقول المتاحة
    console.log('\n📋 جميع الحقول المتاحة:');
    console.log(Object.keys(data).sort().join(', '));
    
    // حفظ البيانات الكاملة
    const fs = require('fs');
    const filename = `twitter-data-${data.id}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\n💾 تم حفظ البيانات الكاملة في: ${filename}`);
    
  } catch (error) {
    console.error('❌ فشل:', error.message);
    
    if (error.stderr) {
      console.error('\n📄 تفاصيل الخطأ:');
      console.error(error.stderr.toString());
    }
  }
}

console.log('\n═══════════════════════════════════════');
console.log('✅ انتهى الاختبار');
