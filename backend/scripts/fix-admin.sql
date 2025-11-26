-- Delete old admin
DELETE FROM admins WHERE email = 'admin@heritage.com';

-- Create new admin with correct password hash
INSERT INTO admins (id, email, password, name, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@heritage.com',
  '$2b$10$CG8/xGH5ktPenVqxatFl2OVBNOs0ezVsfdH/09NSQH3JW5/3ftCx2',
  'Admin',
  true,
  NOW(),
  NOW()
);
