-- Create admin user if not exists
INSERT INTO admins (id, email, password, name, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'admin@heritage.com',
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDlwpZtQfU1w2wuxC.1SKjq/Uxm2',
  'Admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin@heritage.com'
);

-- Add sample performers
INSERT INTO performers (id, name, bio, location, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'محمد الأول',
  'مؤدي تراثي محترف',
  'صنعاء',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM performers WHERE name = 'محمد الأول'
);

INSERT INTO performers (id, name, bio, location, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'أحمد الثاني',
  'متخصص في التراث الشعبي',
  'عدن',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM performers WHERE name = 'أحمد الثاني'
);
