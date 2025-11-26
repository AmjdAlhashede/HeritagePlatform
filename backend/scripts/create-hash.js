const bcrypt = require('bcrypt');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('\nPassword:', password);
  console.log('Hash:', hash);
  console.log('\nSQL Command:');
  console.log(`UPDATE admins SET password = '${hash}' WHERE email = 'admin@heritage.com';`);
});
