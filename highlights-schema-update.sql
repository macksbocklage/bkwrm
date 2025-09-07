-- Check if highlights table exists and update if needed
-- This script will add missing columns and policies without dropping data

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'highlights' AND column_name = 'color') THEN
        ALTER TABLE highlights ADD COLUMN color TEXT DEFAULT '#ffff00';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'highlights' AND column_name = 'updated_at') THEN
        ALTER TABLE highlights ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_id ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at DESC);

-- Enable Row Level Security if not already enabled
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;
DROP POLICY IF EXISTS "Service role can manage all highlights" ON highlights;

-- Create RLS policies
CREATE POLICY "Users can view their own highlights" ON highlights
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own highlights" ON highlights
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own highlights" ON highlights
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own highlights" ON highlights
  FOR DELETE USING (auth.uid()::text = user_id);

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_highlights_updated_at ON highlights;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_highlights_updated_at 
    BEFORE UPDATE ON highlights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
