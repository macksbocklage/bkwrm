-- Create books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  original_filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  reading_progress INTEGER DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100)
);

-- Create index for faster queries
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_uploaded_at ON books(uploaded_at DESC);
CREATE INDEX idx_books_last_read_at ON books(last_read_at DESC);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own books
CREATE POLICY "Users can view their own books" ON books
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own books
CREATE POLICY "Users can insert their own books" ON books
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own books
CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own books
CREATE POLICY "Users can delete their own books" ON books
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create storage bucket for books
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false);

-- Create storage policies
-- Users can upload files to their own folder
CREATE POLICY "Users can upload their own books" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own files
CREATE POLICY "Users can view their own books" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'books' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own books" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
