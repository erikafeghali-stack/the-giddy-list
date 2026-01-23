-- Wishlist/Registry Enhancement Migration
-- Run this in your Supabase SQL Editor

-- 1. Enhance wishlists table with product metadata and status tracking
ALTER TABLE wishlists
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS retailer VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asin VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quantity_claimed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create registries table for shareable gift registries
CREATE TABLE IF NOT EXISTS registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  occasion VARCHAR(100),
  event_date DATE,
  is_public BOOLEAN DEFAULT true,
  show_prices BOOLEAN DEFAULT true,
  show_purchased BOOLEAN DEFAULT false,
  allow_anonymous_claims BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create registry_items junction table
CREATE TABLE IF NOT EXISTS registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(registry_id, wishlist_id)
);

-- 4. Create gift_claims table for tracking reserved/purchased items
CREATE TABLE IF NOT EXISTS gift_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  registry_id UUID REFERENCES registries(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  claim_type VARCHAR(20) DEFAULT 'reserved',
  quantity INTEGER DEFAULT 1,
  note TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  purchased_at TIMESTAMPTZ
);

-- 5. Create price_history table for future price tracking
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_registries_slug ON registries(slug);
CREATE INDEX IF NOT EXISTS idx_registries_kid_id ON registries(kid_id);
CREATE INDEX IF NOT EXISTS idx_registry_items_registry_id ON registry_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_registry_items_wishlist_id ON registry_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_gift_claims_wishlist_id ON gift_claims(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_gift_claims_registry_id ON gift_claims(registry_id);
CREATE INDEX IF NOT EXISTS idx_price_history_wishlist_id ON price_history(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON wishlists(status);
CREATE INDEX IF NOT EXISTS idx_wishlists_kid_id ON wishlists(kid_id);

-- 7. Enable RLS (Row Level Security) on new tables
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for registries
-- Owner can do everything
CREATE POLICY "Users can manage own registries" ON registries
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view public registries
CREATE POLICY "Public registries are viewable" ON registries
  FOR SELECT USING (is_public = true);

-- 9. RLS Policies for registry_items
-- Owner can manage items in their registries
CREATE POLICY "Users can manage items in own registries" ON registry_items
  FOR ALL USING (
    registry_id IN (SELECT id FROM registries WHERE user_id = auth.uid())
  );

-- Anyone can view items in public registries
CREATE POLICY "Public registry items are viewable" ON registry_items
  FOR SELECT USING (
    registry_id IN (SELECT id FROM registries WHERE is_public = true)
  );

-- 10. RLS Policies for gift_claims
-- Registry owners can view all claims on their items
CREATE POLICY "Registry owners can view claims" ON gift_claims
  FOR SELECT USING (
    wishlist_id IN (
      SELECT w.id FROM wishlists w
      WHERE w.user_id = auth.uid()
    )
  );

-- Anyone can create claims (for guest claiming)
CREATE POLICY "Anyone can create claims" ON gift_claims
  FOR INSERT WITH CHECK (true);

-- Users can manage their own claims
CREATE POLICY "Users can manage own claims" ON gift_claims
  FOR ALL USING (user_id = auth.uid());

-- 11. RLS Policies for price_history
-- Owners can see price history for their items
CREATE POLICY "Users can view own price history" ON price_history
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

-- System can insert price history (via service role)
CREATE POLICY "Service can insert price history" ON price_history
  FOR INSERT WITH CHECK (true);

-- 12. Function to update wishlist status based on claims
CREATE OR REPLACE FUNCTION update_wishlist_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wishlists
  SET
    quantity_claimed = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM gift_claims
      WHERE wishlist_id = NEW.wishlist_id
    ),
    status = CASE
      WHEN (
        SELECT COALESCE(SUM(quantity), 0)
        FROM gift_claims
        WHERE wishlist_id = NEW.wishlist_id AND claim_type = 'purchased'
      ) >= wishlists.quantity THEN 'purchased'
      WHEN (
        SELECT COALESCE(SUM(quantity), 0)
        FROM gift_claims
        WHERE wishlist_id = NEW.wishlist_id
      ) >= wishlists.quantity THEN 'reserved'
      ELSE 'available'
    END,
    updated_at = NOW()
  WHERE id = NEW.wishlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Trigger to auto-update wishlist status on claim changes
DROP TRIGGER IF EXISTS trigger_update_wishlist_status ON gift_claims;
CREATE TRIGGER trigger_update_wishlist_status
  AFTER INSERT OR UPDATE OR DELETE ON gift_claims
  FOR EACH ROW EXECUTE FUNCTION update_wishlist_status();

-- 14. Function to update registry updated_at timestamp
CREATE OR REPLACE FUNCTION update_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Trigger for registry timestamp
DROP TRIGGER IF EXISTS trigger_update_registry_timestamp ON registries;
CREATE TRIGGER trigger_update_registry_timestamp
  BEFORE UPDATE ON registries
  FOR EACH ROW EXECUTE FUNCTION update_registry_timestamp();

-- 16. Function to update wishlist updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Trigger for wishlist timestamp
DROP TRIGGER IF EXISTS trigger_update_wishlist_timestamp ON wishlists;
CREATE TRIGGER trigger_update_wishlist_timestamp
  BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_wishlist_timestamp();
