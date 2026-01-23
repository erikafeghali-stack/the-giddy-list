-- Trending Gifts table for auto-populated gift recommendations
CREATE TABLE IF NOT EXISTS trending_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  product_url TEXT NOT NULL,
  affiliate_url TEXT,
  retailer VARCHAR(50),
  age_range VARCHAR(10) NOT NULL CHECK (age_range IN ('0-2', '3-5', '6-8', '9-12', '13-18')),
  category VARCHAR(50),
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('amazon', 'google', 'social', 'manual')),
  trending_score INTEGER DEFAULT 50 CHECK (trending_score >= 0 AND trending_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trending_gifts_age_range ON trending_gifts(age_range);
CREATE INDEX IF NOT EXISTS idx_trending_gifts_category ON trending_gifts(category);
CREATE INDEX IF NOT EXISTS idx_trending_gifts_trending_score ON trending_gifts(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_gifts_source ON trending_gifts(source);

-- Create unique constraint on product_url to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_gifts_product_url ON trending_gifts(product_url);

-- Enable RLS
ALTER TABLE trending_gifts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trending gifts (public data)
CREATE POLICY "Trending gifts are viewable by everyone"
  ON trending_gifts FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (admin operations)
CREATE POLICY "Service role can manage trending gifts"
  ON trending_gifts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_trending_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trending_gifts_updated_at
  BEFORE UPDATE ON trending_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_trending_gifts_updated_at();
