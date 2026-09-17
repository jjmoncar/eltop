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
-- Freemium ranking tables
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    link_url TEXT,
    tagline TEXT,
    logo_url TEXT,
    position INTEGER,
    current_price NUMERIC(10,2),
    click_count INTEGER NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_bid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bid_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.leaderboard_entries(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 20),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    bidder_user_id UUID REFERENCES auth.users(id),
    previous_bid_amount NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_category_position
    ON public.leaderboard_entries(category_id, position);
CREATE INDEX IF NOT EXISTS idx_entries_category_registered
    ON public.leaderboard_entries(category_id, registered_at);
CREATE INDEX IF NOT EXISTS idx_bid_history_entry_created
    ON public.bid_history(entry_id, created_at DESC);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved freemium entries are viewable by everyone" ON public.leaderboard_entries;
CREATE POLICY "Approved freemium entries are viewable by everyone"
    ON public.leaderboard_entries FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Bid history is private" ON public.bid_history;
CREATE POLICY "Bid history is private" ON public.bid_history FOR SELECT USING (false);

-- ------------------------------------------------------------------------------
-- Freemium pricing and atomic placement
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_challenge_price(
    p_category_id UUID,
    p_position INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_current_price NUMERIC;
    v_previous_price NUMERIC;
BEGIN
    IF p_position < 1 OR p_position > 20 THEN
        RAISE EXCEPTION 'Position must be between 1 and 20';
    END IF;

    SELECT current_price INTO v_current_price
    FROM public.leaderboard_entries
    WHERE category_id = p_category_id AND position = p_position;

    IF v_current_price IS NOT NULL THEN
        RETURN round(v_current_price * 1.20, 2);
    END IF;

    IF p_position = 1 THEN
        RETURN 5.00;
    END IF;

    SELECT current_price INTO v_previous_price
    FROM public.leaderboard_entries
    WHERE category_id = p_category_id AND position = p_position - 1;

    IF v_previous_price IS NULL THEN
        RETURN round(public.get_challenge_price(p_category_id, p_position - 1) * 1.20, 2);
    END IF;

    RETURN round(v_previous_price * 1.20, 2);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.place_bid(
    p_entry_id UUID,
    p_category_id UUID,
    p_position INTEGER,
    p_amount NUMERIC,
    p_bidder_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_required_price NUMERIC;
    v_previous_price NUMERIC;
    v_target_entry_id UUID;
    v_entry_category_id UUID;
BEGIN
    IF p_position < 1 OR p_position > 20 OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid position or amount');
    END IF;

    -- Advisory lock closes the gap when the target position is currently empty.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_category_id::TEXT || ':' || p_position::TEXT, 0));

    SELECT id, current_price INTO v_target_entry_id, v_previous_price
    FROM public.leaderboard_entries
    WHERE category_id = p_category_id AND position = p_position
    FOR UPDATE;

    SELECT category_id INTO v_entry_category_id
    FROM public.leaderboard_entries
    WHERE id = p_entry_id
    FOR UPDATE;

    IF v_entry_category_id IS NULL OR v_entry_category_id <> p_category_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
    END IF;

    v_required_price := public.get_challenge_price(p_category_id, p_position);
    IF p_amount < v_required_price THEN
        RETURN jsonb_build_object(
            'success', false,
            'required_price', v_required_price
        );
    END IF;

    UPDATE public.leaderboard_entries
    SET position = NULL,
        current_price = NULL,
        is_paid = false,
        last_bid_at = NULL
    WHERE category_id = p_category_id AND position = p_position;

    UPDATE public.leaderboard_entries
    SET position = p_position,
        current_price = round(p_amount, 2),
        is_paid = true,
        last_bid_at = now()
    WHERE id = p_entry_id;

    INSERT INTO public.bid_history (
        entry_id, category_id, position, amount, bidder_user_id, previous_bid_amount
    ) VALUES (
        p_entry_id, p_category_id, p_position, round(p_amount, 2), p_bidder_id,
        CASE WHEN v_previous_price IS NULL THEN v_required_price / 1.20 ELSE v_previous_price END
    );

    RETURN jsonb_build_object(
        'success', true,
        'required_price', v_required_price,
        'displaced_entry_id', v_target_entry_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.register_free_entry(
    p_category_id UUID,
    p_display_name TEXT,
    p_link_url TEXT DEFAULT NULL,
    p_tagline TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS public.leaderboard_entries AS $$
DECLARE
    v_position INTEGER;
    v_entry public.leaderboard_entries;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_category_id::TEXT || ':free-entry', 0));

    SELECT slot.position INTO v_position
    FROM generate_series(1, 20) AS slot(position)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.leaderboard_entries entry
        WHERE entry.category_id = p_category_id AND entry.position = slot.position
    )
    ORDER BY slot.position
    LIMIT 1;

    INSERT INTO public.leaderboard_entries (
        user_id, category_id, display_name, link_url, tagline, logo_url, position, is_paid
    ) VALUES (
        p_user_id, p_category_id, trim(p_display_name), NULLIF(trim(p_link_url), ''),
        NULLIF(trim(p_tagline), ''), NULLIF(trim(p_logo_url), ''), v_position, false
    )
    RETURNING * INTO v_entry;

    RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
    entry_id UUID REFERENCES public.leaderboard_entries(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    target_position INTEGER CHECK (target_position BETWEEN 1 AND 20),
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

ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS entry_id UUID REFERENCES public.leaderboard_entries(id) ON DELETE SET NULL;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS target_position INTEGER CHECK (target_position BETWEEN 1 AND 20);
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

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

CREATE OR REPLACE FUNCTION public.increment_entry_click_count(target_entry_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.leaderboard_entries
    SET click_count = click_count + 1
    WHERE id = target_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Categories: Read public, write admin/service-role
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- Listings: Read public (approved), write admin/service-role
DROP POLICY IF EXISTS "Approved listings are viewable by everyone" ON public.listings;
CREATE POLICY "Approved listings are viewable by everyone" ON public.listings
    FOR SELECT USING (is_approved = true);

-- Bids: Accessible only via service-role backend to protect buyer_email and raw_payment_data.
-- Direct anon access to the raw table is blocked to prevent PII leaks.
-- Public feed is exposed via the sanitized view public_bids below.
DROP VIEW IF EXISTS public.public_bids;
CREATE VIEW public.public_bids WITH (security_invoker = false) AS
    SELECT 
        id, category_id, listing_id, bid_amount_cents, 
        buyer_name, target_name, tagline, target_url, 
        logo_url, created_at
    FROM public.bids
    WHERE payment_status = 'paid';

GRANT SELECT ON public.public_bids TO anon, authenticated;

-- Click events: Insertable via RPC/service-role
DROP POLICY IF EXISTS "Click events are insertable by anyone" ON public.click_events;
CREATE POLICY "Click events are insertable by anyone" ON public.click_events
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. Table: admin_users (Administrative User Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- 'superadmin', 'admin', 'moderator'
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Seed Initial Categories & Launch Listings
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name_es, name_pt, description_es, description_pt, min_bid_increment_cents, min_floor_cents, icon)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'saas', 'SaaS & Software', 'SaaS e Software', 'Herramientas de software, apps y plataformas para empresas y creadores.', 'Ferramentas de software, aplicativos e plataformas para empresas e criadores.', 500, 2000, 'Cpu'),
    ('22222222-2222-2222-2222-222222222222', 'cripto', 'Cripto & Web3', 'Cripto e Web3', 'Proyectos DeFi, exchanges, bots, tokens y comunidades crypto en LATAM.', 'Projetos DeFi, exchanges, bots, tokens e comunidades cripto na América Latina.', 500, 2000, 'Coins'),
    ('33333333-3333-3333-3333-333333333333', 'ecommerce', 'E-commerce & Afiliados', 'E-commerce e Afiliados', 'Tiendas online, productos digitales, programas de afiliados y dropshipping.', 'Lojas virtuais, produtos digitais, programas de afiliados e dropshipping.', 500, 1500, 'ShoppingBag'),
    ('44444444-4444-4444-4444-444444444444', 'marketing', 'Marketing & Agencias', 'Marketing e Agências', 'Agencias de crecimiento, newsletters, creadores de contenido y herramientas de pauta.', 'Agências de crescimento, newsletters, criadores de contenido y herramientas de mídia.', 500, 1500, 'TrendingUp')
ON CONFLICT (slug) DO NOTHING;

-- Seed Settings
INSERT INTO public.settings (key, value, updated_at)
VALUES 
    ('general', '{"maintenance": false, "platform_name": "eltop.lat", "usdt_trc20_wallet": "TY1234567890SampleWalletAddressLATAM"}'::jsonb, now())
ON CONFLICT (key) DO NOTHING;

-- Seed Default Administrative User
-- Default password is: admin123 (Change immediately in panel)
INSERT INTO public.admin_users (id, email, password_hash, name, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@eltop.lat', 'e1toplat_admin_salt_2026:cb213ae94ee32956947689fa7e3d7912da9848b3ef00333fb31f7955205b4f4ead5b265ec630f6ad7ea0edb715a173322f7701e35cd6d812bb862962fff02d62', 'Administrador Principal', 'superadmin', true)
ON CONFLICT (email) DO NOTHING;
