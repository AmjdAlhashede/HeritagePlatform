// اختبار استخراج العنوان من أنماط مختلفة

const testCases = [
  {
    name: 'مثال 1 - نمط زامل |',
    description: 'زامل | تجار الأبد - ذكرى الشهيد اليوم والشعب الحسينيّ يحتشد بعنفوان حسين يوم التضحية وشموخ زيد',
    expected: 'تجار الأبد'
  },
  {
    name: 'مثال 2 - نمط عادي',
    description: 'عيسى الليث - شعب الوفاء - كلمات أبو هادي الوايلي',
    expected: 'شعب الوفاء'
  },
  {
    name: 'مثال 3 - بدون نمط واضح',
    description: 'قصيدة جميلة عن اليمن والمقاومة',
    expected: 'قصيدة جميلة عن اليمن والمقاومة'
  },
  {
    name: 'مثال 4 - نمط قصيدة |',
    description: 'قصيدة | يا حسين - في ذكرى الشهداء الأبرار',
    expected: 'يا حسين'
  },
];

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

console.log('\n🧪 اختبار استخراج العنوان من أنماط مختلفة\n');
console.log('═══════════════════════════════════════════════════════════════\n');

testCases.forEach((test, i) => {
  console.log(`${i + 1}. ${test.name}`);
  console.log('   النص:', test.description);
  
  const result = extractBestTitle({ description: test.description });
  const isCorrect = result === test.expected;
  
  console.log(`   النتيجة: "${result}"`);
  console.log(`   المتوقع: "${test.expected}"`);
  console.log(`   ${isCorrect ? '✅ صحيح' : '❌ خطأ'}\n`);
});

console.log('═══════════════════════════════════════════════════════════════\n');
