import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Category, Listing, Bid } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseServiceKey.includes('placeholder')
);

// Admin client for backend operations with service role
export const supabaseAdmin = isSupabaseConfigured
  ? createSupabaseClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// ==============================================================================
// In-Memory Mock Store (Fallback when Supabase credentials are not yet connected)
// ==============================================================================
export const mockCategories: Category[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'saas',
    name_es: 'SaaS & Software',
    name_pt: 'SaaS e Software',
    description_es: 'Herramientas de software, apps y plataformas para empresas y creadores.',
    description_pt: 'Ferramentas de software, aplicativos e plataformas para empresas e criadores.',
    min_bid_increment_cents: 500, // $5 USD
    min_floor_cents: 2000,        // $20 USD
    icon: 'Cpu',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'cripto',
    name_es: 'Cripto & Web3',
    name_pt: 'Cripto e Web3',
    description_es: 'Proyectos DeFi, exchanges, bots, tokens y comunidades crypto en LATAM.',
    description_pt: 'Projetos DeFi, exchanges, bots, tokens e comunidades cripto na América Latina.',
    min_bid_increment_cents: 500,
    min_floor_cents: 2000,
    icon: 'Coins',
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'ecommerce',
    name_es: 'E-commerce & Afiliados',
    name_pt: 'E-commerce e Afiliados',
    description_es: 'Tiendas online, productos digitales, programas de afiliados y dropshipping.',
    description_pt: 'Lojas virtuais, produtos digitais, programas de afiliados e dropshipping.',
    min_bid_increment_cents: 500,
    min_floor_cents: 1500,
    icon: 'ShoppingBag',
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'marketing',
    name_es: 'Marketing & Agencias',
    name_pt: 'Marketing e Agências',
    description_es: 'Agencias de crecimiento, newsletters, creadores de contenido y herramientas de pauta.',
    description_pt: 'Agências de crescimento, newsletters, criadores de conteúdo e ferramentas de mídia.',
    min_bid_increment_cents: 500,
    min_floor_cents: 1500,
    icon: 'TrendingUp',
    created_at: new Date().toISOString(),
  },
];

export const mockListings: Listing[] = [];
export const mockBids: Bid[] = [];

