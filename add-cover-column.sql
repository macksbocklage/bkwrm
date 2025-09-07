-- Add cover_image_url column to books table
ALTER TABLE books ADD COLUMN cover_image_url TEXT;

-- Create book-covers storage bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Set up RLS policy for book-covers bucket (run this in Supabase dashboard or via API)
-- CREATE POLICY "Users can view book covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
-- CREATE POLICY "Users can upload book covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-covers');
-- CREATE POLICY "Users can update book covers" ON storage.objects FOR UPDATE USING (bucket_id = 'book-covers');
-- CREATE POLICY "Users can delete book covers" ON storage.objects FOR DELETE USING (bucket_id = 'book-covers');
