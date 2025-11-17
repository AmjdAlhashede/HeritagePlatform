// Script لإضافة محتوى تجريبي للزوامل
const API_URL = 'http://localhost:3000/api';

// Helper function for API calls
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
  return response.json();
}

// بيانات تسجيل الدخول
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

// مؤدين الزوامل
const performers = [
  {
    name: 'عبدالله الدبعي',
    bio: 'شاعر وزامل يمني مشهور، معروف بزواميله الحماسية والوطنية',
    profileImage: 'https://i.pravatar.cc/300?img=12',
    coverImage: 'https://picsum.photos/seed/performer1/1200/400',
    category: 'زوامل حماسية',
    verified: true
  },
  {
    name: 'محمد الحارثي',
    bio: 'من أشهر مؤدي الزوامل اليمنية التراثية والشعبية',
    profileImage: 'https://i.pravatar.cc/300?img=33',
    coverImage: 'https://picsum.photos/seed/performer2/1200/400',
    category: 'زوامل تراثية',
    verified: true
  },
  {
    name: 'أحمد الصنعاني',
    bio: 'زامل شاب موهوب متخصص في الزوامل الاجتماعية والوطنية',
    profileImage: 'https://i.pravatar.cc/300?img=51',
    coverImage: 'https://picsum.photos/seed/performer3/1200/400',
    category: 'زوامل اجتماعية',
    verified: false
  },
  {
    name: 'علي المخلافي',
    bio: 'شاعر وزامل من تهامة، مشهور بزواميله التهامية الأصيلة',
    profileImage: 'https://i.pravatar.cc/300?img=68',
    coverImage: 'https://picsum.photos/seed/performer4/1200/400',
    category: 'زوامل تهامية',
    verified: true
  },
  {
    name: 'حسن الحضرمي',
    bio: 'زامل حضرمي متميز بأسلوبه الفريد في الأداء',
    profileImage: 'https://i.pravatar.cc/300?img=15',
    coverImage: 'https://picsum.photos/seed/performer5/1200/400',
    category: 'زوامل حضرمية',
    verified: false
  }
];

// محتوى الزوامل
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
  },
  {
    title: 'زامل البطولة',
    description: 'زامل يتحدث عن البطولة والشجاعة',
    type: 'video',
    duration: 334,
    performerIndex: 1
  },
  {
    title: 'زامل الأصالة',
    description: 'زامل يمني أصيل بكلمات رائعة',
    type: 'audio',
    duration: 256,
    performerIndex: 3
  }
];

async function seedData() {
  try {
    console.log('🚀 بدء إضافة المحتوى التجريبي...\n');

    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await apiCall('/auth/login', 'POST', adminCredentials);
    const token = loginResponse.access_token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. إضافة المؤدين
    console.log('👥 إضافة المؤدين...');
    const createdPerformers = [];
    for (const performer of performers) {
      try {
        const response = await apiCall('/performers', 'POST', performer, token);
        createdPerformers.push(response);
        console.log(`✅ تمت إضافة: ${performer.name}`);
      } catch (error) {
        console.log(`⚠️  خطأ في إضافة ${performer.name}`);
      }
    }
    console.log(`\n✅ تمت إضافة ${createdPerformers.length} مؤدي\n`);

    // 3. إضافة المحتوى
    console.log('🎵 إضافة المحتوى...');
    let contentCount = 0;
    for (const item of contentItems) {
      try {
        const performer = createdPerformers[item.performerIndex];
        if (!performer) continue;

        const contentData = {
          title: item.title,
          description: item.description,
          type: item.type,
          performerId: performer.id,
          duration: item.duration,
          thumbnailUrl: `https://picsum.photos/seed/${item.title}/640/360`,
          videoUrl: item.type === 'video' ? `https://example.com/videos/${item.title}.mp4` : null,
          audioUrl: `https://example.com/audio/${item.title}.mp3`,
          fileSize: Math.floor(Math.random() * 50000000) + 5000000,
          views: Math.floor(Math.random() * 10000),
          likes: Math.floor(Math.random() * 1000),
          downloads: Math.floor(Math.random() * 500)
        };

        await apiCall('/content', 'POST', contentData, token);
        contentCount++;
        console.log(`✅ تمت إضافة: ${item.title}`);
      } catch (error) {
        console.log(`⚠️  خطأ في إضافة ${item.title}`);
      }
    }
    console.log(`\n✅ تمت إضافة ${contentCount} محتوى\n`);

    console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
    console.log('\n📊 الإحصائيات:');
    console.log(`   - المؤدين: ${createdPerformers.length}`);
    console.log(`   - المحتوى: ${contentCount}`);
    console.log('\n🌐 يمكنك الآن تصفح:');
    console.log('   - Admin Dashboard: http://localhost:5174');
    console.log('   - User Web App: http://localhost:5175');

  } catch (error) {
    console.error('❌ خطأ:', error.response?.data || error.message);
  }
}

seedData();
