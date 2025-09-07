-- Create highlights table
CREATE TABLE highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  start_cfi TEXT NOT NULL,
  end_cfi TEXT NOT NULL,
  color TEXT DEFAULT '#ffff00', -- Default yellow highlight
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_book_id ON highlights(book_id);
CREATE INDEX idx_highlights_created_at ON highlights(created_at DESC);

-- Enable Row Level Security
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own highlights
CREATE POLICY "Users can view their own highlights" ON highlights
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own highlights
CREATE POLICY "Users can insert their own highlights" ON highlights
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own highlights
CREATE POLICY "Users can update their own highlights" ON highlights
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own highlights
CREATE POLICY "Users can delete their own highlights" ON highlights
  FOR DELETE USING (auth.uid()::text = user_id);

-- Allow service role to manage all highlights (for API operations)
CREATE POLICY "Service role can manage all highlights" ON highlights
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_highlights_updated_at 
    BEFORE UPDATE ON highlights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
