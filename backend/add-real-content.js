// Script لإضافة محتوى حقيقي للاختبار
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

async function addRealContent() {
  try {
    console.log('🚀 إضافة محتوى حقيقي للاختبار...\n');

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

    // 3. حذف المحتوى القديم
    console.log('🗑️  حذف المحتوى القديم...');
    const oldContent = await apiCall('/content?limit=100', 'GET');
    for (const item of oldContent.data) {
      try {
        await apiCall(`/content/${item.id}`, 'DELETE', null, token);
      } catch (error) {
        // ignore
      }
    }
    console.log('✅ تم حذف المحتوى القديم\n');

    // 4. إضافة محتوى حقيقي من الإنترنت
    console.log('🎵 إضافة محتوى حقيقي...\n');
    
    const realContent = [
      // فيديوهات تجريبية من Big Buck Bunny
      {
        title: 'زامل يا حبذا الموت - فيديو',
        description: 'زامل حماسي يمني تراثي',
        type: 'video',
        performerIndex: 0,
        duration: 596,
        thumbnailUrl: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
        originalFileUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        hlsUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        audioUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
      {
        title: 'زامل الوطن غالي - فيديو',
        description: 'زامل وطني مؤثر',
        type: 'video',
        performerIndex: 1,
        duration: 634,
        thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        originalFileUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        hlsUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        audioUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        title: 'زامل البطولة - فيديو',
        description: 'زامل عن الشجاعة والبطولة',
        type: 'video',
        performerIndex: 2,
        duration: 725,
        thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        originalFileUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        hlsUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        audioUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      // صوتيات تجريبية
      {
        title: 'زامل يا ليل طول - صوت',
        description: 'زامل تراثي أصيل',
        type: 'audio',
        performerIndex: 3,
        duration: 180,
        thumbnailUrl: 'https://picsum.photos/seed/audio1/640/360',
        originalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        title: 'زامل تهامي أصيل - صوت',
        description: 'من أجمل الزوامل التهامية',
        type: 'audio',
        performerIndex: 4,
        duration: 210,
        thumbnailUrl: 'https://picsum.photos/seed/audio2/640/360',
        originalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        title: 'زامل حضرمي تراثي - صوت',
        description: 'زامل حضرمي بأسلوب فريد',
        type: 'audio',
        performerIndex: 0,
        duration: 195,
        thumbnailUrl: 'https://picsum.photos/seed/audio3/640/360',
        originalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        title: 'زامل العز والشرف - صوت',
        description: 'زامل حماسي قوي',
        type: 'audio',
        performerIndex: 1,
        duration: 220,
        thumbnailUrl: 'https://picsum.photos/seed/audio4/640/360',
        originalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        title: 'زامل يا مرحبا - صوت',
        description: 'زامل ترحيبي اجتماعي',
        type: 'audio',
        performerIndex: 2,
        duration: 185,
        thumbnailUrl: 'https://picsum.photos/seed/audio5/640/360',
        originalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      },
    ];

    let count = 0;
    for (const item of realContent) {
      const performer = performers[item.performerIndex];
      if (!performer) continue;

      const contentData = {
        title: item.title,
        description: item.description,
        type: item.type,
        performerId: performer.id,
        duration: item.duration,
        thumbnailUrl: item.thumbnailUrl,
        originalFileUrl: item.originalFileUrl,
        hlsUrl: item.hlsUrl || null,
        audioUrl: item.audioUrl,
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
        console.log(`⚠️  خطأ في إضافة ${item.title}`);
      }
    }

    console.log(`\n🎉 تم إضافة ${count} محتوى حقيقي بنجاح!`);
    console.log('\n📺 المحتوى يتضمن:');
    console.log('   - 3 فيديوهات تجريبية (Big Buck Bunny, Elephants Dream, etc.)');
    console.log('   - 5 ملفات صوتية تجريبية (SoundHelix)');
    console.log('\n🌐 افتح الآن:');
    console.log('   - User Web App: http://localhost:5175');
    console.log('   - جرب تشغيل الفيديو والصوت!');
    console.log('\n⚠️  ملاحظة: هذا محتوى تجريبي للاختبار فقط');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

addRealContent();
