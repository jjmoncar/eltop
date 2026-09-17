export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Category {
  id: string;
  slug: string;
  name_es: string;
  name_pt: string;
  name_en?: string;
  description_es?: string | null;
  description_pt?: string | null;
  description_en?: string | null;
  min_bid_increment_cents: number;
  min_floor_cents: number;
  icon: string;
  created_at: string;
}

export interface Listing {
  id: string;
  category_id: string;
  rank_type: 'all_time' | 'daily';
  position: number | null;
  name: string;
  tagline: string;
  url: string;
  logo_url?: string | null;
  email?: string;
  current_bid_cents: number;
  is_paid?: boolean;
  registered_at?: string;
  last_bid_at?: string | null;
  click_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface LeaderboardEntry {
  id: string;
  user_id?: string | null;
  category_id: string;
  display_name: string;
  link_url?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  position: number | null;
  current_price?: number | null;
  is_paid: boolean;
  is_approved: boolean;
  registered_at: string;
  last_bid_at?: string | null;
  created_at: string;
}

export interface Bid {
  id: string;
  listing_id?: string | null;
  entry_id?: string | null;
  category_id: string;
  target_position?: number | null;
  bid_amount_cents: number;
  buyer_name: string;
  buyer_email: string;
  target_name: string;
  tagline: string;
  target_url: string;
  logo_url?: string | null;
  payment_provider: 'mercadopago' | 'stripe_pix' | 'paypal' | 'usdt_manual';
  payment_id?: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  raw_payment_data?: Json | null;
  created_at: string;
  category?: Category;
}

export interface ClickEvent {
  id: string;
  listing_id: string;
  ip_hash?: string | null;
  user_agent?: string | null;
  referer?: string | null;
  country_code?: string | null;
  created_at: string;
}

export type CurrencyCode = 'USD' | 'ARS' | 'BRL' | 'COP' | 'CLP' | 'PEN' | 'VES';

export interface CurrencyRate {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateAgainstUSD: number; // 1 USD = X Local Currency
  decimals: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'moderator';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
}

