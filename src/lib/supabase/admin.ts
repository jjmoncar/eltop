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

export const mockListings: Listing[] = [
  {
    id: 'list-101',
    category_id: '11111111-1111-1111-1111-111111111111',
    rank_type: 'all_time',
    position: 1,
    name: 'FacturaFast LATAM',
    tagline: 'Facturación electrónica automática para Argentina, Colombia y México con API REST',
    url: 'https://facturafast.lat',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=faces',
    email: 'contacto@facturafast.lat',
    current_bid_cents: 12500, // $125 USD
    click_count: 842,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'list-102',
    category_id: '11111111-1111-1111-1111-111111111111',
    rank_type: 'all_time',
    position: 2,
    name: 'LeadFlow CRM',
    tagline: 'El CRM de WhatsApp preferido por equipos de ventas en LATAM',
    url: 'https://leadflow.app',
    logo_url: 'https://images.unsplash.com/photo-1633409381658-a0c212a60d81?w=100&h=100&fit=crop&crop=faces',
    email: 'sales@leadflow.app',
    current_bid_cents: 8500, // $85 USD
    click_count: 620,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'list-103',
    category_id: '11111111-1111-1111-1111-111111111111',
    rank_type: 'all_time',
    position: 3,
    name: 'Botify Soporte IA',
    tagline: 'Agentes de inteligencia artificial para atención al cliente 24/7 en español y portugués',
    url: 'https://botify.ia',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=faces',
    email: 'hello@botify.ia',
    current_bid_cents: 4500, // $45 USD
    click_count: 310,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'list-201',
    category_id: '22222222-2222-2222-2222-222222222222',
    rank_type: 'all_time',
    position: 1,
    name: 'CriptoRemesas',
    tagline: 'Envía USDT a cuentas bancarias y Pix en 30 segundos sin comisiones ocultas',
    url: 'https://criptoremesas.com',
    logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop&crop=faces',
    email: 'soporte@criptoremesas.com',
    current_bid_cents: 18000, // $180 USD
    click_count: 1240,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'list-202',
    category_id: '22222222-2222-2222-2222-222222222222',
    rank_type: 'all_time',
    position: 2,
    name: 'Alpha LATAM Club',
    tagline: 'Comunidad privada de trading crypto, airdrops y señales DeFi verificadas',
    url: 'https://alphalatam.club',
    logo_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop&crop=faces',
    email: 'admin@alphalatam.club',
    current_bid_cents: 9500, // $95 USD
    click_count: 512,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'list-301',
    category_id: '33333333-3333-3333-3333-333333333333',
    rank_type: 'all_time',
    position: 1,
    name: 'DropExpress Andes',
    tagline: 'Plataforma de dropshipping contraentrega (COD) para Colombia, Perú y Chile',
    url: 'https://dropexpress.la',
    logo_url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=100&h=100&fit=crop&crop=faces',
    email: 'info@dropexpress.la',
    current_bid_cents: 11000, // $110 USD
    click_count: 730,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'list-401',
    category_id: '44444444-4444-4444-4444-444444444444',
    rank_type: 'all_time',
    position: 1,
    name: 'GrowthHackers LATAM',
    tagline: 'Escalamos startups B2B y E-commerce a 7 cifras con Meta Ads y TikTok Ads',
    url: 'https://growthlatam.agency',
    logo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop&crop=faces',
    email: 'growth@growthlatam.agency',
    current_bid_cents: 14000, // $140 USD
    click_count: 980,
    is_approved: true,
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export const mockBids: Bid[] = [
  {
    id: 'bid-001',
    listing_id: 'list-201',
    category_id: '22222222-2222-2222-2222-222222222222',
    bid_amount_cents: 18000,
    buyer_name: 'Mateo Morales',
    buyer_email: 'mateo@criptoremesas.com',
    target_name: 'CriptoRemesas',
    tagline: 'Envía USDT a cuentas bancarias y Pix en 30 segundos sin comisiones ocultas',
    target_url: 'https://criptoremesas.com',
    logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop&crop=faces',
    payment_provider: 'mercadopago',
    payment_id: 'mp_pay_987654321',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'bid-002',
    listing_id: 'list-401',
    category_id: '44444444-4444-4444-4444-444444444444',
    bid_amount_cents: 14000,
    buyer_name: 'Camila Silva',
    buyer_email: 'growth@growthlatam.agency',
    target_name: 'GrowthHackers LATAM',
    tagline: 'Escalamos startups B2B y E-commerce a 7 cifras con Meta Ads y TikTok Ads',
    target_url: 'https://growthlatam.agency',
    logo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop&crop=faces',
    payment_provider: 'mercadopago',
    payment_id: 'mp_pay_123456789',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'bid-003',
    listing_id: 'list-101',
    category_id: '11111111-1111-1111-1111-111111111111',
    bid_amount_cents: 12500,
    buyer_name: 'Ignacio R.',
    buyer_email: 'contacto@facturafast.lat',
    target_name: 'FacturaFast LATAM',
    tagline: 'Facturación electrónica automática para Argentina, Colombia y México con API REST',
    target_url: 'https://facturafast.lat',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=faces',
    payment_provider: 'mercadopago',
    payment_id: 'mp_pay_554433221',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];
