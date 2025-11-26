// Script لحذف البيانات القديمة وإضافة بيانات جديدة
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
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }
  
  return result;
}

// بيانات تسجيل الدخول
const adminCredentials = {
  email: 'admin@zawamel.com',
  password: 'admin123'
};

// مؤدين الزوامل
const performers = [
  {
    name: 'عبدالله الدبعي',
    bio: 'شاعر وزامل يمني مشهور، معروف بزواميله الحماسية والوطنية',
    imageUrl: 'https://i.pravatar.cc/300?img=12',
    location: 'صنعاء'
  },
  {
    name: 'محمد الحارثي',
    bio: 'من أشهر مؤدي الزوامل اليمنية التراثية والشعبية',
    imageUrl: 'https://i.pravatar.cc/300?img=33',
    location: 'مأرب'
  },
  {
    name: 'أحمد الصنعاني',
    bio: 'زامل شاب موهوب متخصص في الزوامل الاجتماعية والوطنية',
    imageUrl: 'https://i.pravatar.cc/300?img=51',
    location: 'صنعاء'
  },
  {
    name: 'علي المخلافي',
    bio: 'شاعر وزامل من تهامة، مشهور بزواميله التهامية الأصيلة',
    imageUrl: 'https://i.pravatar.cc/300?img=68',
    location: 'الحديدة'
  },
  {
    name: 'حسن الحضرمي',
    bio: 'زامل حضرمي متميز بأسلوبه الفريد في الأداء',
    imageUrl: 'https://i.pravatar.cc/300?img=15',
    location: 'حضرموت'
  }
];

async function clearAndSeed() {
  try {
    console.log('🚀 بدء تنظيف وإضافة البيانات...\n');

    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await apiCall('/auth/login', 'POST', adminCredentials);
    const token = loginResponse.access_token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. حذف المؤدين القدامى
    console.log('🗑️  حذف البيانات القديمة...');
    const oldPerformers = await apiCall('/performers', 'GET');
    for (const performer of oldPerformers.data) {
      try {
        await apiCall(`/performers/${performer.id}`, 'DELETE', null, token);
        console.log(`✅ تم حذف: ${performer.name}`);
      } catch (error) {
        console.log(`⚠️  خطأ في حذف ${performer.name}`);
      }
    }
    console.log('');

    // 3. إضافة المؤدين الجدد
    console.log('👥 إضافة المؤدين الجدد...');
    const createdPerformers = [];
    for (const performer of performers) {
      try {
        const response = await apiCall('/performers', 'POST', performer, token);
        createdPerformers.push(response);
        console.log(`✅ تمت إضافة: ${performer.name}`);
      } catch (error) {
        console.log(`⚠️  خطأ في إضافة ${performer.name}:`, error.message);
      }
    }
    console.log(`\n✅ تمت إضافة ${createdPerformers.length} مؤدي جديد\n`);

    console.log('🎉 تم تحديث البيانات بنجاح!');
    console.log('\n📊 الإحصائيات:');
    console.log(`   - المؤدين: ${createdPerformers.length}`);
    console.log('\n🌐 افتح الآن:');
    console.log('   - Admin Dashboard: http://localhost:5174');
    console.log('   - اذهب لصفحة "المؤدين" لرؤية البيانات الجديدة');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

clearAndSeed();
