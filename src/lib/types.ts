// Wishlist & Registry Types

export type WishlistStatus = 'available' | 'reserved' | 'purchased';

export type Retailer = 'amazon' | 'walmart' | 'target' | 'other';

export type ClaimType = 'reserved' | 'purchased';

// Enhanced wishlist item with product metadata
export interface WishlistItem {
  id: string;
  kid_id: string;
  user_id: string;
  url: string;
  title: string | null;
  notes: string | null;
  image_url: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  original_url: string | null;
  affiliate_url: string | null;
  retailer: Retailer | null;
  asin: string | null;
  status: WishlistStatus;
  priority: number;
  quantity: number;
  quantity_claimed: number;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

// Registry for shareable gift lists
export interface Registry {
  id: string;
  user_id: string;
  kid_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  occasion: string | null;
  event_date: string | null;
  is_public: boolean;
  show_prices: boolean;
  show_purchased: boolean;
  allow_anonymous_claims: boolean;
  created_at: string;
  updated_at: string;
}

// Junction table for registry items
export interface RegistryItem {
  id: string;
  registry_id: string;
  wishlist_id: string;
  display_order: number;
}

// Gift claim for tracking who reserved/purchased what
export interface GiftClaim {
  id: string;
  wishlist_id: string;
  registry_id: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  claim_type: ClaimType;
  quantity: number;
  note: string | null;
  claimed_at: string;
  purchased_at: string | null;
}

// Price history entry for tracking price changes
export interface PriceHistory {
  id: string;
  wishlist_id: string;
  price: number;
  currency: string;
  recorded_at: string;
}

// Scraped product data from URL
export interface ScrapedProduct {
  title: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  retailer: Retailer;
  asin: string | null;
  original_url: string;
  affiliate_url: string | null;
}

// API request/response types
export interface ScrapeRequest {
  url: string;
}

export interface ScrapeResponse {
  success: boolean;
  data?: ScrapedProduct;
  error?: string;
}

export interface ClaimRequest {
  wishlist_id: string;
  guest_name?: string;
  guest_email?: string;
  claim_type: ClaimType;
  quantity?: number;
  note?: string;
}

export interface ClaimResponse {
  success: boolean;
  claim?: GiftClaim;
  error?: string;
}

// Registry with items for display
export interface RegistryWithItems extends Registry {
  items: (WishlistItem & { display_order: number })[];
  kid?: {
    id: string;
    name: string;
  } | null;
}

// Form types for creating/editing
export interface CreateRegistryInput {
  name: string;
  kid_id?: string;
  slug?: string;
  description?: string;
  occasion?: string;
  event_date?: string;
  is_public?: boolean;
  show_prices?: boolean;
  show_purchased?: boolean;
  allow_anonymous_claims?: boolean;
}

export interface UpdateRegistryInput extends Partial<CreateRegistryInput> {
  id: string;
}

export interface AddWishlistItemInput {
  kid_id: string;
  url: string;
  title?: string;
  notes?: string;
  priority?: number;
  quantity?: number;
}

// Kid types (moved from kids page for reuse)
export interface KidSizes {
  clothing_top: string | null;
  clothing_bottom: string | null;
  shoe_size: string | null;
  pajamas: string | null;
  socks: string | null;
  underwear_size: string | null;
  diaper_or_underwear: string | null;
  notes: string | null;
}

export interface KidPreferences {
  interests: string[];
  favorite_things: string[];
  dislikes: string[];
  allergies: string[];
  colors: string[];
  notes: string | null;
}

export interface Kid {
  id: string;
  name: string;
  birthdate: string | null;
  kid_sizes: KidSizes | null;
  kid_preferences: KidPreferences | null;
}

// Creator Profile types
export interface CreatorProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  total_followers: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfileWithStats extends CreatorProfile {
  following_count?: number;
  collections_count?: number;
  registries_count?: number;
}

// Follow types
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Collection types (LTK-style guides)
export type AgeRange = '0-2' | '3-5' | '6-8' | '9-12' | '13-18';

export type CollectionCategory =
  | 'toys'
  | 'clothing'
  | 'books'
  | 'gear'
  | 'room-decor'
  | 'outdoor'
  | 'arts-crafts'
  | 'electronics'
  | 'sports'
  | 'other';

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  age_range: AgeRange | null;
  category: CollectionCategory | null;
  tags: string[];
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  wishlist_id: string | null;
  product_url: string | null;
  product_title: string | null;
  product_image_url: string | null;
  product_price: number | null;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface CollectionWithItems extends Collection {
  items: CollectionItem[];
  creator?: CreatorProfile;
}

// Notification types
export type NotificationType = 'follow' | 'claim' | 'thank_you' | 'collection_like';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// Thank you note types
export interface ThankYouNote {
  id: string;
  claim_id: string;
  sender_id: string | null;
  recipient_email: string | null;
  message: string;
  sent_at: string;
}

// Form types for collections
export interface CreateCollectionInput {
  title: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  age_range?: AgeRange;
  category?: CollectionCategory;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {
  id: string;
}

export interface AddCollectionItemInput {
  collection_id: string;
  wishlist_id?: string;
  product_url?: string;
  product_title?: string;
  product_image_url?: string;
  product_price?: number;
  caption?: string;
  display_order?: number;
}

// Form types for profile
export interface UpdateProfileInput {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  is_public?: boolean;
}

// Extended registry type with cover image
export interface RegistryWithCover extends Registry {
  cover_image_url: string | null;
}

// Trending gift types
export interface TrendingGift {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  product_url: string;
  affiliate_url: string | null;
  retailer: Retailer | null;
  age_range: AgeRange;
  category: CollectionCategory | null;
  source: 'amazon' | 'google' | 'social' | 'manual';
  trending_score: number;
  created_at: string;
  updated_at: string;
}

export interface TrendingGiftSearch {
  query: string;
  age_range?: AgeRange;
  category?: CollectionCategory;
  limit?: number;
}
