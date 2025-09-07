-- Quick test to verify highlights table is working
-- Run this in your Supabase SQL editor

-- Test if we can insert a highlight
INSERT INTO highlights (user_id, book_id, text, start_cfi, end_cfi, color)
VALUES ('test-user-123', '00000000-0000-0000-0000-000000000000', 'Test highlight from SQL', 'test-start', 'test-end', '#ffff00')
RETURNING *;

-- Clean up the test data
DELETE FROM highlights WHERE user_id = 'test-user-123';
