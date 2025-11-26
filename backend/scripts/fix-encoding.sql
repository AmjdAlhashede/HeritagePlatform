-- إصلاح ترميز قاعدة البيانات للعربية
-- تشغيل هذا السكريبت مرة واحدة فقط

-- تحديث ترميز قاعدة البيانات
ALTER DATABASE heritage SET client_encoding TO 'UTF8';

-- تحديث ترميز الجداول
ALTER TABLE performers ALTER COLUMN name TYPE TEXT;
ALTER TABLE performers ALTER COLUMN bio TYPE TEXT;
ALTER TABLE performers ALTER COLUMN location TYPE TEXT;

ALTER TABLE content ALTER COLUMN title TYPE TEXT;
ALTER TABLE content ALTER COLUMN description TYPE TEXT;

ALTER TABLE categories ALTER COLUMN name TYPE TEXT;
ALTER TABLE categories ALTER COLUMN description TYPE TEXT;

ALTER TABLE comments ALTER COLUMN text TYPE TEXT;

-- تأكيد الترميز
SHOW client_encoding;
SHOW server_encoding;
