-- Make performer_id nullable for queue functionality
ALTER TABLE content ALTER COLUMN performer_id DROP NOT NULL;
