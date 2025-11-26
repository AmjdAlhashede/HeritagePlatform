// جلب Aparat playlist باستخدام Puppeteer
const puppeteer = require('puppeteer-core');

async function getAparatPlaylist(playlistId) {
  let browser;
  
  try {
    console.log('🚀 بدء Puppeteer...');
    
    // محاولة استخدام Chrome أو Edge المثبت
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.CHROME_PATH,
    ].filter(Boolean);
    
    let executablePath;
    const fs = require('fs');
    for (const path of chromePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }
    
    if (!executablePath) {
      throw new Error('Chrome غير موجود. يرجى تثبيت Google Chrome');
    }
    
    console.log(`📍 استخدام Chrome: ${executablePath}`);
    
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // الاستماع لطلبات API
    const videoIds = new Set();
    
    page.on('response', async (response) => {
      const url = response.url();
      
      // البحث عن API calls التي تحتوي على بيانات الفيديوهات
      if (url.includes('aparat.com/api') && url.includes('video')) {
        try {
          const data = await response.json();
          
          // استخراج IDs من الرد
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach(item => {
              if (typeof item === 'string') {
                videoIds.add(item);
              } else if (item.uid) {
                videoIds.add(item.uid);
              } else if (item.id) {
                videoIds.add(item.id);
              }
            });
          }
          
          if (data.included && Array.isArray(data.included)) {
            data.included.forEach(item => {
              if (item.attributes && item.attributes.uid) {
                videoIds.add(item.attributes.uid);
              }
            });
          }
        } catch (e) {
          // تجاهل الأخطاء
        }
      }
    });
    
    console.log(`🌐 فتح الصفحة: https://www.aparat.com/playlist/${playlistId}`);
    
    await page.goto(`https://www.aparat.com/playlist/${playlistId}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // انتظار تحميل المحتوى
    await page.waitForTimeout(3000);
    
    // محاولة scroll لتحميل المزيد
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(2000);
    
    console.log(`✅ تم جلب ${videoIds.size} فيديو`);
    console.log(JSON.stringify({
      success: true,
      count: videoIds.size,
      ids: Array.from(videoIds),
    }));
    
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message,
    }));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const playlistId = process.argv[2] || '588524';
getAparatPlaylist(playlistId);
