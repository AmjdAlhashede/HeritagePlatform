// Script لإنشاء admin
const API_URL = 'http://localhost:3000/api';

async function createAdmin() {
  try {
    console.log('👤 إنشاء حساب admin...\n');

    const adminData = {
      email: 'admin@zawamel.com',
      password: 'admin123',
      name: 'المسؤول'
    };

    const response = await fetch(`${API_URL}/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ تم إنشاء حساب admin بنجاح!');
      console.log('\n📧 البريد: admin@zawamel.com');
      console.log('🔑 كلمة المرور: admin123');
      console.log('\n🌐 يمكنك الآن تسجيل الدخول في:');
      console.log('   http://localhost:5174/login');
    } else {
      console.log('⚠️  ', result.message || 'خطأ في إنشاء الحساب');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createAdmin();
