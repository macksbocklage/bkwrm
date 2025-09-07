-- Verify highlights table structure and permissions
-- Run this in your Supabase SQL editor

-- Check if table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'highlights';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'highlights' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename = 'highlights';

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'highlights';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'highlights';

-- Test insert (this will fail if there are issues)
INSERT INTO highlights (user_id, book_id, text, start_cfi, end_cfi, color)
VALUES ('test-user', '00000000-0000-0000-0000-000000000000', 'Test highlight', 'test-start', 'test-end', '#ffff00');

-- Clean up test data
DELETE FROM highlights WHERE user_id = 'test-user';
