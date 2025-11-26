-- إنشاء حساب الأدمن في Neon
INSERT INTO admins (id, email, password, name, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@heritage.com',
  '$2b$10$4S.tMmn17aSRs9VP5U7JQuJuhRFt73TqPXeukgP/FNBS0jz0mS2Uy',
  'Admin User',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
