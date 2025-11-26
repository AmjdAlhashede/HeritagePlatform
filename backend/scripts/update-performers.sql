-- Add new columns to performers table
ALTER TABLE performers ADD COLUMN IF NOT EXISTS "birthDate" DATE;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS "deathDate" DATE;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS "joinedAnsarallahDate" DATE;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS "isDeceased" BOOLEAN DEFAULT false;
