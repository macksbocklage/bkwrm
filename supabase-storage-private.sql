-- Keep the books bucket private for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'books';

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Public access to books" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;

-- Allow service role to manage all storage (for API operations)
CREATE POLICY "Service role can manage all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own books" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow users to view their own files (for signed URL generation)
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
