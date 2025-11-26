-- Sample performers
INSERT INTO performers (id, name, bio, location, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Mohammed Al-Awwal', 'Professional Zawamel performer', 'Sanaa', true, NOW(), NOW()),
  (gen_random_uuid(), 'Ahmed Al-Thani', 'Traditional Zawamel specialist', 'Aden', true, NOW(), NOW()),
  (gen_random_uuid(), 'Ali Al-Thalith', 'Folk Zawamel artist', 'Taiz', true, NOW(), NOW());

-- Sample categories
INSERT INTO categories (id, name, description, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Traditional', 'Traditional Yemeni Zawamel', NOW(), NOW()),
  (gen_random_uuid(), 'Modern', 'Modern interpretations', NOW(), NOW()),
  (gen_random_uuid(), 'Folk', 'Folk heritage songs', NOW(), NOW());
