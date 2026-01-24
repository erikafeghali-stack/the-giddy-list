-- Giddy Guide Earnings System Migration
-- Run this in Supabase SQL Editor

-- 1. Create guide_tier enum type
DO $$ BEGIN
  CREATE TYPE guide_tier AS ENUM ('standard', 'curator', 'influencer', 'celebrity');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create transaction_status enum type
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create source_type enum type
DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('wishlist', 'gift_guide', 'collection', 'registry');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Add Giddy Guide fields to creator_profiles (or create if doesn't exist)
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS guide_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guide_tier guide_tier DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS payout_email TEXT,
ADD COLUMN IF NOT EXISTS earnings_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS guide_bio TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_tiktok TEXT,
ADD COLUMN IF NOT EXISTS social_youtube TEXT,
ADD COLUMN IF NOT EXISTS social_pinterest TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 5. Create earnings_transactions table
CREATE TABLE IF NOT EXISTS earnings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_id UUID,
  product_url TEXT NOT NULL,
  product_title TEXT,
  product_price DECIMAL(10,2),
  commission_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  guide_share DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_share DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status transaction_status DEFAULT 'pending',
  click_id UUID,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create affiliate_clicks table for tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT, -- anonymous tracking
  source_type source_type NOT NULL,
  source_id UUID,
  product_url TEXT NOT NULL,
  product_title TEXT,
  product_price DECIMAL(10,2),
  affiliate_url TEXT,
  retailer TEXT,
  ip_hash TEXT, -- hashed for privacy
  user_agent TEXT,
  referer TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payout_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_earnings_guide_id ON earnings_transactions(guide_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_transactions(status);
CREATE INDEX IF NOT EXISTS idx_earnings_created ON earnings_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_guide_id ON affiliate_clicks(guide_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_guide_id ON payout_requests(guide_id);

-- 9. Create function to update earnings balance
CREATE OR REPLACE FUNCTION update_guide_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Move from pending to confirmed
    UPDATE creator_profiles
    SET
      pending_earnings = pending_earnings - NEW.guide_share,
      earnings_balance = earnings_balance + NEW.guide_share,
      total_earnings = total_earnings + NEW.guide_share
    WHERE id = NEW.guide_id;
  ELSIF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN
    -- New pending transaction
    UPDATE creator_profiles
    SET pending_earnings = pending_earnings + NEW.guide_share
    WHERE id = NEW.guide_id;
  ELSIF NEW.status = 'paid' AND OLD.status = 'confirmed' THEN
    -- Paid out
    UPDATE creator_profiles
    SET earnings_balance = earnings_balance - NEW.guide_share
    WHERE id = NEW.guide_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for earnings updates
DROP TRIGGER IF EXISTS trigger_update_guide_earnings ON earnings_transactions;
CREATE TRIGGER trigger_update_guide_earnings
  AFTER UPDATE ON earnings_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_earnings();

-- 11. Add RLS policies
ALTER TABLE earnings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Guides can view their own earnings
CREATE POLICY "Guides can view own earnings" ON earnings_transactions
  FOR SELECT USING (auth.uid() = guide_id);

-- Guides can view their own clicks
CREATE POLICY "Guides can view own clicks" ON affiliate_clicks
  FOR SELECT USING (auth.uid() = guide_id);

-- System can insert clicks (via service role)
CREATE POLICY "System can insert clicks" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- Guides can view and create payout requests
CREATE POLICY "Guides can view own payouts" ON payout_requests
  FOR SELECT USING (auth.uid() = guide_id);

CREATE POLICY "Guides can request payouts" ON payout_requests
  FOR INSERT WITH CHECK (auth.uid() = guide_id);

-- 12. Create view for public guide profiles
CREATE OR REPLACE VIEW public_guides AS
SELECT
  cp.id,
  cp.username,
  cp.display_name,
  cp.avatar_url,
  cp.cover_image_url,
  cp.guide_bio,
  cp.guide_tier,
  cp.social_instagram,
  cp.social_tiktok,
  cp.social_youtube,
  cp.social_pinterest,
  cp.is_featured,
  cp.created_at
FROM creator_profiles cp
WHERE cp.guide_enabled = true AND cp.is_public = true;

COMMENT ON TABLE earnings_transactions IS 'Tracks all earnings for Giddy Guides from affiliate commissions';
COMMENT ON TABLE affiliate_clicks IS 'Tracks clicks on affiliate links for attribution';
COMMENT ON TABLE payout_requests IS 'Tracks payout requests from Giddy Guides';
