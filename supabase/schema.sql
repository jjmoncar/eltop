-- ==============================================================================
-- eltop.lat — Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Table: categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name_es TEXT NOT NULL,
    name_pt TEXT NOT NULL,
    description_es TEXT,
    description_pt TEXT,
    min_bid_increment_cents INTEGER NOT NULL DEFAULT 500, -- $5.00 USD en centavos
    min_floor_cents INTEGER NOT NULL DEFAULT 2000,        -- $20.00 USD en centavos para el puesto #1
    icon TEXT NOT NULL DEFAULT 'Sparkles',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. Table: listings (Current Rank Holders)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    rank_type TEXT NOT NULL DEFAULT 'all_time', -- 'all_time' o 'daily'
    position INTEGER NOT NULL,                  -- 1, 2, 3, etc.
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    email TEXT NOT NULL,
    current_bid_cents INTEGER NOT NULL,         -- Monto actual en centavos USD
    click_count INTEGER NOT NULL DEFAULT 0,
    is_approved BOOLEAN NOT NULL DEFAULT true,  -- Moderación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_category_rank_position UNIQUE (category_id, rank_type, position)
);

-- ------------------------------------------------------------------------------
-- 3. Table: bids (Bid History & Checkout Transactions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    bid_amount_cents INTEGER NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    target_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    target_url TEXT NOT NULL,
    logo_url TEXT,
    payment_provider TEXT NOT NULL DEFAULT 'mercadopago', -- 'mercadopago', 'stripe_pix', 'usdt_manual'
    payment_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'paid', 'failed', 'refunded'
    raw_payment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Table: click_events (Redirect Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    ip_hash TEXT,
    user_agent TEXT,
    referer TEXT,
    country_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. Table: settings (Platform Configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- Indexes for Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_cat_rank_pos ON public.listings (category_id, rank_type, position);
CREATE INDEX IF NOT EXISTS idx_bids_listing_created ON public.bids (listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_category_created ON public.bids (category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_status_created ON public.bids (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_listing_created ON public.click_events (listing_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- Atomic Function: increment_click_count
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_click_count(target_listing_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.listings
    SET click_count = click_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Categories: Read public, write admin/service-role
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- Listings: Read public (approved), write admin/service-role
CREATE POLICY "Approved listings are viewable by everyone" ON public.listings
    FOR SELECT USING (is_approved = true);

-- Bids: Read public only paid bids (for activity feed), write admin/service-role
CREATE POLICY "Paid bids are viewable by everyone" ON public.bids
    FOR SELECT USING (payment_status = 'paid');

-- Click events: Insertable via RPC/service-role
CREATE POLICY "Click events are insertable by anyone" ON public.click_events
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Seed Initial Categories & Launch Listings
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name_es, name_pt, description_es, description_pt, min_bid_increment_cents, min_floor_cents, icon)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'saas', 'SaaS & Software', 'SaaS e Software', 'Herramientas de software, apps y plataformas para empresas y creadores.', 'Ferramentas de software, aplicativos e plataformas para empresas e criadores.', 500, 2000, 'Cpu'),
    ('22222222-2222-2222-2222-222222222222', 'cripto', 'Cripto & Web3', 'Cripto e Web3', 'Proyectos DeFi, exchanges, bots, tokens y comunidades crypto en LATAM.', 'Projetos DeFi, exchanges, bots, tokens e comunidades cripto na América Latina.', 500, 2000, 'Coins'),
    ('33333333-3333-3333-3333-333333333333', 'ecommerce', 'E-commerce & Afiliados', 'E-commerce e Afiliados', 'Tiendas online, productos digitales, programas de afiliados y dropshipping.', 'Lojas virtuais, produtos digitais, programas de afiliados e dropshipping.', 500, 1500, 'ShoppingBag'),
    ('44444444-4444-4444-4444-444444444444', 'marketing', 'Marketing & Agencias', 'Marketing e Agências', 'Agencias de crecimiento, newsletters, creadores de contenido y herramientas de pauta.', 'Agências de crescimento, newsletters, criadores de conteúdo e ferramentas de mídia.', 500, 1500, 'TrendingUp')
ON CONFLICT (slug) DO NOTHING;

-- Seed Settings
INSERT INTO public.settings (key, value, updated_at)
VALUES 
    ('general', '{"maintenance": false, "platform_name": "eltop.lat", "usdt_trc20_wallet": "TY1234567890SampleWalletAddressLATAM"}'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
