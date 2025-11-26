const { Client } = require('pg');
require('dotenv').config();

// إعداد اتصال قاعدة البيانات
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function deleteContentFromDatabase() {
  console.log('🗑️  بدء حذف بيانات المحتوى من قاعدة البيانات...\n');
  
  try {
    await dbClient.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // عرض عدد السجلات قبل الحذف
    const countBefore = await dbClient.query('SELECT COUNT(*) FROM content');
    console.log(`📊 عدد الفيديوهات الحالية: ${countBefore.rows[0].count}`);
    
    if (countBefore.rows[0].count === '0') {
      console.log('ℹ️  لا توجد فيديوهات للحذف');
      return 0;
    }

    // حذف جميع السجلات من جدول content فقط
    const result = await dbClient.query('DELETE FROM content');
    const deletedCount = result.rowCount;

    console.log(`✅ تم حذف ${deletedCount} سجل من جدول content`);
    
    // إعادة تعيين sequence للـ ID (إذا كان موجوداً)
    try {
      await dbClient.query('ALTER SEQUENCE content_id_seq RESTART WITH 1');
      console.log('✅ تم إعادة تعيين sequence للـ ID');
    } catch (seqError) {
      console.log('ℹ️  لا يوجد sequence للإعادة (هذا طبيعي في بعض الإعدادات)');
    }

    // التحقق من الجداول الأخرى
    const performersCount = await dbClient.query('SELECT COUNT(*) FROM performer');
    const categoriesCount = await dbClient.query('SELECT COUNT(*) FROM category');
    const adminsCount = await dbClient.query('SELECT COUNT(*) FROM admin');

    console.log('\n📊 البيانات المحفوظة:');
    console.log(`   ✅ المؤدون: ${performersCount.rows[0].count} سجل`);
    console.log(`   ✅ الفئات: ${categoriesCount.rows[0].count} سجل`);
    console.log(`   ✅ المسؤولون: ${adminsCount.rows[0].count} سجل`);

    return deletedCount;
  } catch (error) {
    console.error('❌ خطأ في حذف بيانات المحتوى:', error);
    throw error;
  } finally {
    await dbClient.end();
    console.log('\n✅ تم إغلاق اتصال قاعدة البيانات');
  }
}

async function main() {
  console.log('🚀 بدء عملية حذف بيانات المحتوى من قاعدة البيانات...\n');
  console.log('⚠️  ملاحظة: هذا السكربت يحذف فقط من قاعدة البيانات');
  console.log('⚠️  لحذف ملفات R2، استخدم cleanup-r2-only.js\n');
  
  try {
    const dbDeletedCount = await deleteContentFromDatabase();

    console.log('\n✅ ✅ ✅ اكتملت عملية التنظيف بنجاح! ✅ ✅ ✅');
    console.log(`📊 تم حذف ${dbDeletedCount} سجل من قاعدة البيانات`);
    
  } catch (error) {
    console.error('\n❌ فشلت عملية التنظيف:', error.message);
    process.exit(1);
  }
}

// تشغيل السكربت
main();
