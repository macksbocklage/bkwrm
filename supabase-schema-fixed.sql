-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

-- Create new policies that work with service role
-- Allow service role to bypass RLS
CREATE POLICY "Service role can manage all books" ON books
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to see their own books
CREATE POLICY "Users can view their own books" ON books
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    auth.uid()::text = user_id
  );

-- Allow authenticated users to insert their own books
CREATE POLICY "Users can insert their own books" ON books
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    auth.uid()::text = user_id
  );

-- Allow authenticated users to update their own books
CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (
    auth.role() = 'service_role' OR 
    auth.uid()::text = user_id
  );

-- Allow authenticated users to delete their own books
CREATE POLICY "Users can delete their own books" ON books
  FOR DELETE USING (
    auth.role() = 'service_role' OR 
    auth.uid()::text = user_id
  );

-- Update storage policies as well
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;

-- Allow service role to manage all storage objects
CREATE POLICY "Service role can manage all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own books" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow users to view their own files
CREATE POLICY "Users can view their own books" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own books" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );
