const fs = require('fs');

// قراءة البيانات
const data = JSON.parse(fs.readFileSync('twitter-data-1474099013884551171.json', 'utf8'));

console.log('\n🧪 اختبار استخراج العنوان والصورة المصغرة\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// محاكاة دالة extractBestTitle
function extractBestTitle(videoData) {
  // محاولة استخدام السطر الأول من الوصف
  if (videoData.description) {
    const firstLine = videoData.description.split('\n')[0].trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 200) {
      return firstLine;
    }
  }
  
  // استخدام fulltitle إذا كان متوفراً
  if (videoData.fulltitle && !videoData.fulltitle.includes('...')) {
    return videoData.fulltitle;
  }
  
  // استخدام title كخيار أخير
  return videoData.title || videoData.fulltitle || 'بدون عنوان';
}

// محاكاة دالة getBestThumbnail
function getBestThumbnail(videoData) {
  // محاولة الحصول على أكبر صورة متاحة
  if (videoData.thumbnails && videoData.thumbnails.length > 0) {
    // البحث عن صورة orig أو large
    const bestThumb = videoData.thumbnails.find(t => t.id === 'orig' || t.id === 'large');
    if (bestThumb) {
      return bestThumb.url;
    }
    // استخدام آخر صورة (عادة الأكبر)
    return videoData.thumbnails[videoData.thumbnails.length - 1].url;
  }
  
  // استخدام thumbnail الافتراضي
  return videoData.thumbnail || '';
}

console.log('📝 العنوان الأصلي (title):');
console.log('  ', data.title);
console.log('\n📝 العنوان الكامل (fulltitle):');
console.log('  ', data.fulltitle);
console.log('\n📝 الوصف (description):');
console.log('  ', data.description);
console.log('\n📝 السطر الأول من الوصف:');
console.log('  ', data.description.split('\n')[0]);

console.log('\n─────────────────────────────────────');
console.log('✅ العنوان المستخرج (الأفضل):');
console.log('  ', extractBestTitle(data));

console.log('\n🖼️  الصورة المصغرة الافتراضية:');
console.log('  ', data.thumbnail);

console.log('\n🖼️  الصورة المصغرة المستخرجة (الأفضل):');
const bestThumb = getBestThumbnail(data);
console.log('  ', bestThumb);

// عرض معلومات الصورة
const thumbInfo = data.thumbnails.find(t => t.url === bestThumb);
if (thumbInfo) {
  console.log('\n📐 معلومات الصورة:');
  console.log('  ID:', thumbInfo.id);
  console.log('  الحجم:', `${thumbInfo.width}x${thumbInfo.height}`);
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
