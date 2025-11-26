const fs = require('fs');

// قراءة الملف المحفوظ
const data = JSON.parse(fs.readFileSync('twitter-data-1474099013884551171.json', 'utf8'));

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📊 معلومات الفيديو الكاملة من Twitter/X');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🆔 معلومات التعريف:');
console.log('─────────────────────────────────────');
console.log('  ID:', data.id);
console.log('  Display ID:', data.display_id);
console.log('  رابط الفيديو:', data.webpage_url);
console.log('  المصدر:', data.extractor);

console.log('\n📝 العنوان والوصف:');
console.log('─────────────────────────────────────');
console.log('  العنوان:', data.title);
console.log('  العنوان الكامل:', data.fulltitle);
console.log('  الوصف:', data.description);

console.log('\n👤 معلومات الناشر:');
console.log('─────────────────────────────────────');
console.log('  اسم الناشر:', data.uploader);
console.log('  معرف الناشر:', data.uploader_id);
console.log('  رابط الناشر:', data.uploader_url);
console.log('  معرف القناة:', data.channel_id);

console.log('\n📅 التواريخ والأوقات:');
console.log('─────────────────────────────────────');
console.log('  تاريخ النشر (YYYYMMDD):', data.upload_date);
console.log('  Timestamp (Unix):', data.timestamp);
console.log('  تاريخ النشر (ISO):', data.timestamp ? new Date(data.timestamp * 1000).toISOString() : 'N/A');
console.log('  تاريخ النشر (عربي):', data.timestamp ? new Date(data.timestamp * 1000).toLocaleString('ar-SA') : 'N/A');

console.log('\n⏱️  معلومات المدة:');
console.log('─────────────────────────────────────');
console.log('  المدة (ثواني):', data.duration);
console.log('  المدة (عدد صحيح):', Math.floor(data.duration));
console.log('  المدة (نص):', data.duration_string);

console.log('\n📊 الإحصائيات:');
console.log('─────────────────────────────────────');
console.log('  المشاهدات:', data.view_count || 'غير متوفر');
console.log('  الإعجابات:', data.like_count || 0);
console.log('  إعادة التغريد:', data.repost_count || 0);
console.log('  التعليقات:', data.comment_count || 0);

console.log('\n🖼️  الصور المصغرة:');
console.log('─────────────────────────────────────');
console.log('  الصورة الرئيسية:', data.thumbnail);
console.log('\n  جميع الأحجام المتاحة:');
data.thumbnails.forEach(thumb => {
  console.log(`    - ${thumb.id}: ${thumb.width}x${thumb.height}`);
  console.log(`      ${thumb.url}`);
});

console.log('\n🎬 معلومات الفيديو التقنية:');
console.log('─────────────────────────────────────');
console.log('  العرض:', data.width);
console.log('  الارتفاع:', data.height);
console.log('  الدقة:', data.resolution);
console.log('  نسبة العرض:', data.aspect_ratio);
console.log('  معدل البت:', data.tbr);
console.log('  كودك الفيديو:', data.vcodec);
console.log('  كودك الصوت:', data.acodec);
console.log('  النطاق الديناميكي:', data.dynamic_range);

console.log('\n📦 الصيغ المتاحة:');
console.log('─────────────────────────────────────');
console.log(`  عدد الصيغ: ${data.formats.length}`);
console.log('\n  صيغ الفيديو:');
data.formats.filter(f => f.vcodec !== 'none').forEach((format, i) => {
  console.log(`    ${i + 1}. ${format.format_id}: ${format.resolution} - ${format.tbr} kbps`);
});
console.log('\n  صيغ الصوت:');
data.formats.filter(f => f.vcodec === 'none').forEach((format, i) => {
  console.log(`    ${i + 1}. ${format.format_id}: ${format.format_note} - ${format.tbr} kbps`);
});

console.log('\n📝 الترجمات:');
console.log('─────────────────────────────────────');
if (data.subtitles && Object.keys(data.subtitles).length > 0) {
  Object.keys(data.subtitles).forEach(lang => {
    console.log(`  ${lang}: ${data.subtitles[lang].length} ملف`);
  });
} else {
  console.log('  لا توجد ترجمات');
}

console.log('\n🏷️  الوسوم (Tags):');
console.log('─────────────────────────────────────');
if (data.tags && data.tags.length > 0) {
  console.log('  ', data.tags.join(', '));
} else {
  console.log('  لا توجد وسوم');
}

console.log('\n📁 معلومات الملف:');
console.log('─────────────────────────────────────');
console.log('  اسم الملف:', data.filename);
console.log('  الامتداد:', data.ext);
console.log('  البروتوكول:', data.protocol);
console.log('  الحجم التقريبي:', data.filesize_approx ? `${(data.filesize_approx / 1024 / 1024).toFixed(2)} MB` : 'غير متوفر');

console.log('\n🔧 معلومات إضافية:');
console.log('─────────────────────────────────────');
console.log('  العمر المحدد:', data.age_limit);
console.log('  سنة الإصدار:', data.release_year || 'غير محدد');
console.log('  نوع المحتوى:', data._type);
console.log('  يحتوي على DRM:', data._has_drm || 'لا');

console.log('\n💾 البيانات المستخدمة في النظام:');
console.log('─────────────────────────────────────');
console.log('  ✅ العنوان:', data.title);
console.log('  ✅ الوصف:', data.description?.substring(0, 100) + '...');
console.log('  ✅ الناشر:', data.uploader);
console.log('  ✅ المدة:', Math.floor(data.duration), 'ثانية');
console.log('  ✅ تاريخ النشر:', new Date(data.timestamp * 1000).toISOString());
console.log('  ✅ الصورة المصغرة:', data.thumbnail);
console.log('  ✅ الإعجابات:', data.like_count);
console.log('  ✅ إعادة التغريد:', data.repost_count);
console.log('  ✅ التعليقات:', data.comment_count);

console.log('\n═══════════════════════════════════════════════════════════════\n');
