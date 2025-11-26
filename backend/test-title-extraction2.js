const fs = require('fs');

const data = JSON.parse(fs.readFileSync('twitter-data-1474099013884551171.json', 'utf8'));

function extractBestTitle(videoData) {
  if (videoData.description) {
    const firstLine = videoData.description.split('\n')[0].trim();
    // إزالة الروابط من نهاية العنوان
    const cleanedLine = firstLine.replace(/https?:\/\/\S+$/g, '').trim();
    if (cleanedLine && cleanedLine.length > 10) {
      return cleanedLine;
    }
  }
  
  if (videoData.fulltitle && !videoData.fulltitle.includes('...')) {
    return videoData.fulltitle;
  }
  
  return videoData.title || videoData.fulltitle || 'بدون عنوان';
}

function getBestThumbnail(videoData) {
  if (videoData.thumbnails && videoData.thumbnails.length > 0) {
    const origThumb = videoData.thumbnails.find(t => t.id === 'orig');
    if (origThumb) {
      return origThumb.url;
    }
    const largeThumb = videoData.thumbnails.find(t => t.id === 'large');
    if (largeThumb) {
      return largeThumb.url;
    }
    return videoData.thumbnails[videoData.thumbnails.length - 1].url;
  }
  
  return videoData.thumbnail || '';
}

console.log('\n✅ النتيجة النهائية:\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📝 العنوان المستخرج:');
console.log('  ', extractBestTitle(data));
console.log('\n🖼️  الصورة المصغرة:');
const thumb = getBestThumbnail(data);
console.log('  ', thumb);
const thumbInfo = data.thumbnails.find(t => t.url === thumb);
if (thumbInfo) {
  console.log('  الحجم:', `${thumbInfo.width}x${thumbInfo.height} (${thumbInfo.id})`);
}
console.log('\n═══════════════════════════════════════════════════════════════\n');
