-- Fix highlights table RLS policies
-- Run this in your Supabase SQL editor

-- First, let's check the current policies
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

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can insert their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;
DROP POLICY IF EXISTS "Service role can manage all highlights" ON highlights;

-- Create new policies that work with Clerk authentication
-- Allow service role to manage all highlights (for API operations)
CREATE POLICY "Service role can manage all highlights" ON highlights
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own highlights
CREATE POLICY "Users can view their own highlights" ON highlights
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    user_id = auth.uid()::text
  );

-- Allow authenticated users to insert their own highlights
CREATE POLICY "Users can insert their own highlights" ON highlights
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR 
    user_id = auth.uid()::text
  );

-- Allow authenticated users to update their own highlights
CREATE POLICY "Users can update their own highlights" ON highlights
  FOR UPDATE USING (
    auth.role() = 'service_role' OR 
    user_id = auth.uid()::text
  );

-- Allow authenticated users to delete their own highlights
CREATE POLICY "Users can delete their own highlights" ON highlights
  FOR DELETE USING (
    auth.role() = 'service_role' OR 
    user_id = auth.uid()::text
  );

-- Verify the policies were created
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
