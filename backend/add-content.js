// Script لإضافة محتوى تجريبي
const API_URL = 'http://localhost:3000/api';

async function apiCall(endpoint, method = 'GET', data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }
  
  return result;
}

async function addContent() {
  try {
    console.log('🚀 إضافة محتوى تجريبي...\n');

    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await apiCall('/auth/login', 'POST', {
      email: 'admin@zawamel.com',
      password: 'admin123'
    });
    const token = loginResponse.access_token;
    console.log('✅ تم تسجيل الدخول\n');

    // 2. جلب المؤدين
    console.log('👥 جلب قائمة المؤدين...');
    const performersResponse = await apiCall('/performers', 'GET');
    const performers = performersResponse.data;
    console.log(`✅ تم جلب ${performers.length} مؤدي\n`);

    if (performers.length === 0) {
      console.log('⚠️  لا يوجد مؤدين! قم بتشغيل seed-initial-data.ts أولاً');
      return;
    }

    // 3. إضافة محتوى لكل مؤدي
    console.log('🎵 إضافة المحتوى...');
    
    const contentItems = [
      {
        title: 'زامل يا حبذا الموت',
        description: 'من أشهر الزوامل الحماسية اليمنية',
        type: 'audio',
        duration: 245,
        performerIndex: 0
      },
      {
        title: 'زامل يا ليل طول',
        description: 'زامل تراثي يمني أصيل',
        type: 'audio',
        duration: 198,
        performerIndex: 1
      },
      {
        title: 'زامل الوطن غالي',
        description: 'زامل وطني حماسي',
        type: 'video',
        duration: 312,
        performerIndex: 0
      },
      {
        title: 'زامل يا راكب الخيل',
        description: 'زامل شعبي مشهور',
        type: 'audio',
        duration: 223,
        performerIndex: 2
      },
      {
        title: 'زامل تهامي أصيل',
        description: 'من أجمل الزوامل التهامية',
        type: 'audio',
        duration: 267,
        performerIndex: 3
      },
      {
        title: 'زامل حضرمي تراثي',
        description: 'زامل حضرمي بأسلوب فريد',
        type: 'video',
        duration: 289,
        performerIndex: 4
      },
      {
        title: 'زامل العز والشرف',
        description: 'زامل حماسي قوي',
        type: 'audio',
        duration: 201,
        performerIndex: 0
      },
      {
        title: 'زامل يا مرحبا',
        description: 'زامل ترحيبي اجتماعي',
        type: 'audio',
        duration: 178,
        performerIndex: 2
      }
    ];

    let count = 0;
    for (const item of contentItems) {
      const performer = performers[item.performerIndex];
      if (!performer) continue;

      const contentData = {
        title: item.title,
        description: item.description,
        type: item.type,
        performerId: performer.id,
        duration: item.duration,
        thumbnailUrl: `https://picsum.photos/seed/${item.title}/640/360`,
        originalFileUrl: item.type === 'video' ? `https://example.com/videos/${item.title}.mp4` : `https://example.com/audio/${item.title}.mp3`,
        hlsUrl: item.type === 'video' ? `https://example.com/hls/${item.title}/playlist.m3u8` : null,
        audioUrl: `https://example.com/audio/${item.title}.mp3`,
        fileSize: Math.floor(Math.random() * 50000000) + 5000000,
        viewCount: Math.floor(Math.random() * 10000),
        downloadCount: Math.floor(Math.random() * 500),
        isProcessed: true
      };

      try {
        await apiCall('/content', 'POST', contentData, token);
        count++;
        console.log(`✅ ${item.title} - ${performer.name}`);
      } catch (error) {
        console.log(`⚠️  خطأ في إضافة ${item.title}:`, error.message);
      }
    }

    console.log(`\n🎉 تم إضافة ${count} محتوى بنجاح!`);
    console.log('\n🌐 افتح الآن:');
    console.log('   - Admin Dashboard: http://localhost:5174');
    console.log('   - صفحة المحتوى لرؤية الزوامل');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

addContent();
