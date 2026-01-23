-- ============================================================
-- Migration: Make kid_id nullable in wishlists table
-- ============================================================
--
-- REQUIRED: Run this migration to fix the "null value in column
-- kid_id" error when adding items directly to registries.
--
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Copy and paste ALL the SQL below
-- 4. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- This migration allows creating wishlist items directly on
-- registries without requiring a kid profile.
-- ============================================================

-- 1. Drop the NOT NULL constraint on kid_id (if it exists)
ALTER TABLE wishlists ALTER COLUMN kid_id DROP NOT NULL;

-- 2. Drop ALL existing policies on wishlists to start fresh
DROP POLICY IF EXISTS "Users can manage own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can update own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Public registry wishlist items are viewable" ON wishlists;
DROP POLICY IF EXISTS "enable_all_for_user" ON wishlists;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON wishlists;

-- 3. Make sure RLS is enabled
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 4. Create policy that allows users to SELECT their own wishlist items
CREATE POLICY "Users can view own wishlists" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Create policy that allows users to INSERT their own wishlist items
-- WITH CHECK is required for INSERT operations
CREATE POLICY "Users can insert own wishlists" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create policy that allows users to UPDATE their own wishlist items
CREATE POLICY "Users can update own wishlists" ON wishlists
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Create policy that allows users to DELETE their own wishlist items
CREATE POLICY "Users can delete own wishlists" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Items in public registries are viewable by anyone (for guests viewing registries)
CREATE POLICY "Public registry wishlist items are viewable" ON wishlists
  FOR SELECT USING (
    id IN (
      SELECT ri.wishlist_id
      FROM registry_items ri
      JOIN registries r ON r.id = ri.registry_id
      WHERE r.is_public = true
    )
  );

-- 9. Add index for wishlists without kid_id (direct registry items)
CREATE INDEX IF NOT EXISTS idx_wishlists_no_kid ON wishlists(user_id) WHERE kid_id IS NULL;
