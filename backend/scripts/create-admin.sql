INSERT INTO admins (id, email, password, name, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@heritage.com',
  '$2b$10$5xZZBQ5CCfkbrM9.YfyxouGv4cLO8OlRlcQft5jkApCnFUMJD1Pma',
  'Admin User',
  true,
  NOW(),
  NOW()
);
