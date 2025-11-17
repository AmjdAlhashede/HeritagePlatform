-- Create first admin user
-- Password: admin123
INSERT INTO admins (id, email, password, name, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@heritage.com',
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDlwpZtQfU1w2wuxC.1SKjq/Uxm2',
  'Admin',
  true,
  NOW(),
  NOW()
);

-- Sample performers
INSERT INTO performers (id, name, bio, location, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'محمد الأول', 'مؤدي زوامل محترف', 'صنعاء', true, NOW(), NOW()),
  (gen_random_uuid(), 'أحمد الثاني', 'متخصص في الزوامل التراثية', 'عدن', true, NOW(), NOW()),
  (gen_random_uuid(), 'علي الثالث', 'فنان زوامل شعبية', 'تعز', true, NOW(), NOW());

-- Note: Content will be added through the upload interface

-- Update database name in connection string to 'heritage'
