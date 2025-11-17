import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'heritage',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function seed() {
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...');
    await AppDataSource.initialize();
    console.log('✅ تم الاتصال بنجاح\n');

    // 1. إنشاء admin
    console.log('👤 إنشاء حساب admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await AppDataSource.query(`
      INSERT INTO admins (email, password, name, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['admin@zawamel.com', hashedPassword, 'المسؤول']);
    
    console.log('✅ تم إنشاء admin');
    console.log('   📧 البريد: admin@zawamel.com');
    console.log('   🔑 كلمة المرور: admin123\n');

    // 2. حذف البيانات القديمة
    console.log('🗑️  حذف البيانات القديمة...');
    await AppDataSource.query('DELETE FROM content');
    await AppDataSource.query('DELETE FROM performers');
    console.log('✅ تم حذف البيانات القديمة\n');

    // 3. إضافة المؤدين
    console.log('👥 إضافة المؤدين...');
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

    for (const performer of performers) {
      await AppDataSource.query(`
        INSERT INTO performers (name, bio, "imageUrl", location, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      `, [performer.name, performer.bio, performer.imageUrl, performer.location]);
      console.log(`✅ تمت إضافة: ${performer.name}`);
    }

    console.log('\n🎉 تم إضافة جميع البيانات بنجاح!');
    console.log('\n🌐 يمكنك الآن:');
    console.log('   1. تسجيل الدخول في: http://localhost:5174/login');
    console.log('   2. عرض المؤدين في لوحة التحكم');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

seed();
