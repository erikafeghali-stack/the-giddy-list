-- Creator Profiles & Social Features Migration
-- Run this in your Supabase SQL Editor

-- 1. Create creator_profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  total_followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create follows table for social following
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. Create collections table (LTK-style guides)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  age_range VARCHAR(20), -- '0-2', '3-5', '6-8', '9-12', '13-18'
  category VARCHAR(50),
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create collection_items table
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE SET NULL,
  product_url TEXT,
  product_title TEXT,
  product_image_url TEXT,
  product_price DECIMAL(10,2),
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- 'follow', 'claim', 'thank_you', 'collection_like'
  title VARCHAR(255),
  message TEXT,
  data JSONB, -- Additional data like related user_id, item_id, etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create thank_you_notes table
CREATE TABLE IF NOT EXISTS thank_you_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES gift_claims(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add cover_image_url to registries table
ALTER TABLE registries
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_profiles_username ON creator_profiles(username);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_is_public ON creator_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_age_range ON collections(age_range);
CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 9. Enable RLS on new tables
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE thank_you_notes ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for creator_profiles
-- Users can manage own profile
CREATE POLICY "Users can manage own profile" ON creator_profiles
  FOR ALL USING (auth.uid() = id);

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable" ON creator_profiles
  FOR SELECT USING (is_public = true);

-- 11. RLS Policies for follows
-- Users can manage own follows
CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

-- Anyone can view follow relationships
CREATE POLICY "Follow relationships are viewable" ON follows
  FOR SELECT USING (true);

-- 12. RLS Policies for collections
-- Users can manage own collections
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view public collections
CREATE POLICY "Public collections are viewable" ON collections
  FOR SELECT USING (is_public = true);

-- 13. RLS Policies for collection_items
-- Users can manage items in own collections
CREATE POLICY "Users can manage own collection items" ON collection_items
  FOR ALL USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );

-- Anyone can view items in public collections
CREATE POLICY "Public collection items are viewable" ON collection_items
  FOR SELECT USING (
    collection_id IN (SELECT id FROM collections WHERE is_public = true)
  );

-- 14. RLS Policies for notifications
-- Users can view and manage own notifications
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 15. RLS Policies for thank_you_notes
-- Senders can manage own notes
CREATE POLICY "Users can manage own thank you notes" ON thank_you_notes
  FOR ALL USING (auth.uid() = sender_id);

-- Recipients can view notes sent to them (via claim)
CREATE POLICY "Recipients can view their thank you notes" ON thank_you_notes
  FOR SELECT USING (
    claim_id IN (
      SELECT id FROM gift_claims
      WHERE user_id = auth.uid() OR guest_email = auth.jwt()->>'email'
    )
  );

-- 16. Function to update follower count
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_profiles
    SET total_followers = total_followers + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creator_profiles
    SET total_followers = GREATEST(total_followers - 1, 0)
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 17. Trigger for follower count
DROP TRIGGER IF EXISTS trigger_update_follower_count ON follows;
CREATE TRIGGER trigger_update_follower_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- 18. Function to update collection/profile timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 19. Triggers for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_creator_profile_timestamp ON creator_profiles;
CREATE TRIGGER trigger_update_creator_profile_timestamp
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_collection_timestamp ON collections;
CREATE TRIGGER trigger_update_collection_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 20. Function to increment collection view count
CREATE OR REPLACE FUNCTION increment_collection_views(collection_slug VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE collections
  SET view_count = view_count + 1
  WHERE slug = collection_slug;
END;
$$ LANGUAGE plpgsql;
