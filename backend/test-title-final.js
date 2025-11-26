const fs = require('fs');

const data = JSON.parse(fs.readFileSync('twitter-data-1474099013884551171.json', 'utf8'));

function extractBestTitle(videoData) {
  let fullText = '';
  
  if (videoData.description) {
    fullText = videoData.description.split('\n')[0].trim();
  } else if (videoData.title) {
    fullText = videoData.title;
  }
  
  // إزالة الروابط
  fullText = fullText.replace(/https?:\/\/\S+$/g, '').trim();
  
  // البحث عن النمط: "| العنوان -"
  const pipeMatch = fullText.match(/\|\s*([^-]+?)\s*-/);
  if (pipeMatch && pipeMatch[1]) {
    const title = pipeMatch[1].trim();
    if (title.length > 3 && title.length < 100) {
      return title;
    }
  }
  
  // البحث عن النمط: "- زامل | العنوان"
  const zamelMatch = fullText.match(/(?:زامل|قصيدة|أنشودة)\s*\|\s*([^-]+)/);
  if (zamelMatch && zamelMatch[1]) {
    const title = zamelMatch[1].trim();
    if (title.length > 3 && title.length < 100) {
      return title;
    }
  }
  
  // إذا لم ينجح، استخدم الجزء بعد آخر "-" قبل أول "ذكرى" أو "كلمات"
  const parts = fullText.split('-').map(p => p.trim());
  if (parts.length > 2) {
    for (let i = 1; i < Math.min(parts.length, 3); i++) {
      const part = parts[i];
      if (part.length > 3 && part.length < 100 && 
          !part.includes('ذكرى') && !part.includes('كلمات') && 
          !part.includes('اليوم') && !part.includes('الشعب')) {
        return part;
      }
    }
  }
  
  return fullText.substring(0, 50);
}

console.log('\n🧪 اختبار استخراج العنوان\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📝 النص الكامل:');
console.log('  ', data.description.split('\n')[0]);

console.log('\n🔍 تحليل النص:');
const fullText = data.description.split('\n')[0].trim().replace(/https?:\/\/\S+$/g, '').trim();
console.log('  بعد إزالة الروابط:', fullText);

// اختبار النمط الأول
const pipeMatch = fullText.match(/\|\s*([^-]+?)\s*-/);
console.log('\n  النمط "| العنوان -":', pipeMatch ? pipeMatch[1].trim() : 'لم يُعثر عليه');

// اختبار النمط الثاني
const zamelMatch = fullText.match(/(?:زامل|قصيدة|أنشودة)\s*\|\s*([^-]+)/);
console.log('  النمط "زامل | العنوان":', zamelMatch ? zamelMatch[1].trim() : 'لم يُعثر عليه');

console.log('\n✅ العنوان المستخرج النهائي:');
console.log('  "' + extractBestTitle(data) + '"');

console.log('\n💾 ما سيُحفظ في قاعدة البيانات:');
console.log('  العنوان:', extractBestTitle(data));
console.log('  الوصف:', data.description);

console.log('\n═══════════════════════════════════════════════════════════════\n');
