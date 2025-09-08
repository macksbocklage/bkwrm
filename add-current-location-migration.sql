-- Migration to add current_location column to books table
-- This column will store the CFI (Canonical Fragment Identifier) or location string
-- to restore the exact reading position when reopening a book

-- Add the current_location column to the books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS current_location TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN books.current_location IS 'Stores the CFI or location string to restore exact reading position';

-- Optional: Create an index on current_location for potential future queries
-- (Commented out as it might not be needed for this use case)
-- CREATE INDEX IF NOT EXISTS idx_books_current_location ON books(current_location);

-- Update any existing books to have a default current_location of '0' if they don't have one
UPDATE books 
SET current_location = '0' 
WHERE current_location IS NULL;

-- You can run this migration in your Supabase SQL editor
