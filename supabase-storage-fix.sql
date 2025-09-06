-- Make the books bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'books';

-- Update storage policies to allow public access
DROP POLICY IF EXISTS "Service role can manage all storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;

-- Allow public access to books (since bucket is now public)
CREATE POLICY "Public access to books" ON storage.objects
  FOR SELECT USING (bucket_id = 'books');

-- Allow service role to manage all storage
CREATE POLICY "Service role can manage all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own books" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own books" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'service_role' OR 
    (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1])
  );
