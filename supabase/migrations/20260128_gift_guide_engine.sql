-- Gift Guide Content Engine Migration
-- Automated daily gift guide generation system
-- Run this in Supabase SQL Editor

-- 1. Create guide_status enum type
DO $$ BEGIN
  CREATE TYPE guide_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create products table - Central product data storage
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  retailer VARCHAR(50) DEFAULT 'amazon',
  age_range VARCHAR(10),
  category VARCHAR(50),
  brand VARCHAR(255),
  rating DECIMAL(2, 1),
  review_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for ASIN (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_asin ON products(asin) WHERE asin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_age_category ON products(age_range, category);
CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;

-- 3. Create gift_guides table - AI-generated guides
CREATE TABLE IF NOT EXISTS gift_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_description VARCHAR(160),
  intro_content TEXT,
  occasion VARCHAR(100),
  age_range VARCHAR(10),
  category VARCHAR(50),
  keywords TEXT[],
  status guide_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_guides_status_published ON gift_guides(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_guides_slug ON gift_guides(slug);
CREATE INDEX IF NOT EXISTS idx_gift_guides_occasion ON gift_guides(occasion);
CREATE INDEX IF NOT EXISTS idx_gift_guides_age_range ON gift_guides(age_range);
CREATE INDEX IF NOT EXISTS idx_gift_guides_category ON gift_guides(category);

-- 4. Create gift_guide_products junction table
CREATE TABLE IF NOT EXISTS gift_guide_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES gift_guides(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  ai_description TEXT,
  highlight_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_guide_products_guide ON gift_guide_products(guide_id);
CREATE INDEX IF NOT EXISTS idx_gift_guide_products_product ON gift_guide_products(product_id);

-- 5. Create guide_generation_logs table - Track generation history
CREATE TABLE IF NOT EXISTS guide_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES gift_guides(id) ON DELETE SET NULL,
  topic_type VARCHAR(50),
  topic_params JSONB,
  status VARCHAR(20),
  error_message TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_guide ON guide_generation_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON guide_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created ON guide_generation_logs(created_at);

-- 6. Add is_admin column to creator_profiles for admin access control
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 7. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_gift_guides_updated_at ON gift_guides;
CREATE TRIGGER trigger_gift_guides_updated_at
  BEFORE UPDATE ON gift_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to increment view count
CREATE OR REPLACE FUNCTION increment_guide_view_count(guide_slug VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE gift_guides
  SET view_count = view_count + 1
  WHERE slug = guide_slug;
END;
$$ LANGUAGE plpgsql;

-- 10. Enable RLS on new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_guide_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_generation_logs ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for products
-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Only admins can insert/update/delete products (via service role)
CREATE POLICY "Service role can manage products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- 12. RLS Policies for gift_guides
-- Anyone can view published guides
CREATE POLICY "Anyone can view published guides" ON gift_guides
  FOR SELECT USING (status = 'published');

-- Admins can view all guides
CREATE POLICY "Admins can view all guides" ON gift_guides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Service role can manage guides
CREATE POLICY "Service role can manage guides" ON gift_guides
  FOR ALL USING (true) WITH CHECK (true);

-- 13. RLS Policies for gift_guide_products
-- Anyone can view products in published guides
CREATE POLICY "Anyone can view guide products" ON gift_guide_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gift_guides
      WHERE id = gift_guide_products.guide_id
      AND status = 'published'
    )
  );

-- Service role can manage guide products
CREATE POLICY "Service role can manage guide products" ON gift_guide_products
  FOR ALL USING (true) WITH CHECK (true);

-- 14. RLS Policies for guide_generation_logs
-- Admins can view logs
CREATE POLICY "Admins can view generation logs" ON guide_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Service role can manage logs
CREATE POLICY "Service role can manage logs" ON guide_generation_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 15. Create view for published guides with product count
CREATE OR REPLACE VIEW published_guides AS
SELECT
  g.id,
  g.slug,
  g.title,
  g.meta_description,
  g.intro_content,
  g.occasion,
  g.age_range,
  g.category,
  g.keywords,
  g.cover_image_url,
  g.view_count,
  g.published_at,
  g.created_at,
  g.updated_at,
  COUNT(gp.id) as product_count
FROM gift_guides g
LEFT JOIN gift_guide_products gp ON g.id = gp.guide_id
WHERE g.status = 'published'
GROUP BY g.id;

-- Comments for documentation
COMMENT ON TABLE products IS 'Central product data storage for gift guides';
COMMENT ON TABLE gift_guides IS 'AI-generated gift guides for SEO and organic traffic';
COMMENT ON TABLE gift_guide_products IS 'Junction table linking products to gift guides';
COMMENT ON TABLE guide_generation_logs IS 'Audit log for AI guide generation attempts';
COMMENT ON COLUMN gift_guides.keywords IS 'Array of SEO keywords for the guide';
COMMENT ON COLUMN gift_guide_products.ai_description IS 'AI-generated product description for this guide context';
COMMENT ON COLUMN gift_guide_products.highlight_reason IS 'Why this product is highlighted in the guide';
