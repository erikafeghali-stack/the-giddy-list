-- Migration: Kids slug + Creator profile onboarding columns
-- Ensures list URLs (/list/username/kidname) and onboarding flow work.
-- Run in Supabase SQL Editor or via supabase db push.

-- 1. Add slug to kids table (for /list/username/kidname lookup)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kids') THEN
    ALTER TABLE kids ADD COLUMN IF NOT EXISTS slug VARCHAR(150);
    -- Backfill slug from name + short id so each slug is unique (list page uses .single())
    UPDATE kids
    SET slug = lower(
      regexp_replace(
        coalesce(
          nullif(trim(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), ''),
          'kid'
        ) || '-' || substr(replace(id::text, '-', ''), 1, 8),
        '-+', '-', 'g'
      )
    )
    WHERE slug IS NULL OR slug = '' OR length(trim(slug)) = 0;
  END IF;
END $$;

-- 2. Add onboarding columns to creator_profiles (used by auth callback + onboarding page)
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_intent VARCHAR(50);

-- 3. Optional: unique index on kids.slug per user to avoid collisions when generating from name
-- (Skip if you prefer slug to be globally unique; list page uses username + kidname so per-user is enough.)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_kids_user_slug ON kids (user_id, slug);
