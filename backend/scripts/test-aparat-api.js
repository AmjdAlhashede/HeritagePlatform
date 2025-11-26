// تجربة Aparat API بطرق مختلفة
const fetch = require('node-fetch');

async function testAparatAPI() {
  const playlistId = '588524';
  
  console.log('🔍 تجربة طرق مختلفة لجلب Aparat playlist...\n');
  
  // طريقة 1: API endpoint الأساسي
  try {
    console.log('1️⃣ محاولة: /api/fa/v1/video/playlist/videohash/list/playlist/');
    const url1 = `https://www.aparat.com/api/fa/v1/video/playlist/videohash/list/playlist/${playlistId}`;
    const res1 = await fetch(url1, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    console.log(`   Status: ${res1.status}`);
    if (res1.ok) {
      const data = await res1.json();
      console.log(`   ✅ نجح! البيانات:`, JSON.stringify(data).substring(0, 200));
    }
  } catch (e) {
    console.log(`   ❌ فشل: ${e.message}`);
  }
  
  // طريقة 2: endpoint مختلف
  try {
    console.log('\n2️⃣ محاولة: /playlist/playlist/');
    const url2 = `https://www.aparat.com/api/fa/v1/playlist/playlist/${playlistId}`;
    const res2 = await fetch(url2, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    console.log(`   Status: ${res2.status}`);
    if (res2.ok) {
      const data = await res2.json();
      console.log(`   ✅ نجح! البيانات:`, JSON.stringify(data).substring(0, 200));
    }
  } catch (e) {
    console.log(`   ❌ فشل: ${e.message}`);
  }
  
  // طريقة 3: جلب الصفحة وتحليل window.__INITIAL_STATE__
  try {
    console.log('\n3️⃣ محاولة: جلب HTML والبحث عن __INITIAL_STATE__');
    const url3 = `https://www.aparat.com/playlist/${playlistId}`;
    const res3 = await fetch(url3, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await res3.text();
    
    // البحث عن window.__INITIAL_STATE__ أو أي بيانات مضمنة
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
    if (stateMatch) {
      console.log(`   ✅ وجدت __INITIAL_STATE__!`);
      const state = JSON.parse(stateMatch[1]);
      console.log(`   البيانات:`, JSON.stringify(state).substring(0, 200));
    } else {
      console.log(`   ❌ لم أجد __INITIAL_STATE__`);
    }
    
    // البحث عن أي JSON في script tags
    const scriptMatches = html.matchAll(/<script[^>]*>([^<]+)<\/script>/g);
    let foundData = false;
    for (const match of scriptMatches) {
      const content = match[1];
      if (content.includes('playlist') || content.includes('video')) {
        try {
          const jsonMatch = content.match(/({[\s\S]*})/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            if (data.playlist || data.videos) {
              console.log(`   ✅ وجدت بيانات في script tag!`);
              console.log(`   البيانات:`, JSON.stringify(data).substring(0, 200));
              foundData = true;
              break;
            }
          }
        } catch (e) {}
      }
    }
    
    if (!foundData) {
      console.log(`   ℹ️  الصفحة React SPA - البيانات تتحمل بـ AJAX`);
    }
  } catch (e) {
    console.log(`   ❌ فشل: ${e.message}`);
  }
  
  // طريقة 4: محاولة endpoints أخرى
  const endpoints = [
    `/api/fa/v1/video/playlist/list/${playlistId}`,
    `/api/fa/v1/playlist/${playlistId}`,
    `/api/fa/v1/playlist/${playlistId}/videos`,
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    try {
      console.log(`\n${4 + i}️⃣ محاولة: ${endpoints[i]}`);
      const url = `https://www.aparat.com${endpoints[i]}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      console.log(`   Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`   ✅ نجح! البيانات:`, JSON.stringify(data).substring(0, 200));
      }
    } catch (e) {
      console.log(`   ❌ فشل: ${e.message}`);
    }
  }
}

testAparatAPI().catch(console.error);
