import { supabaseAdmin, mockCategories, mockListings, isSupabaseConfigured } from '@/lib/supabase/admin';
import { Category, Listing } from '@/types/database';

export interface MinimumPriceCalculation {
  categoryId: string;
  categoryName: string;
  targetPosition: number;
  currentBidCents: number;
  minIncrementCents: number;
  requiredBidCents: number;
  occupantName?: string | null;
  isNewSlot: boolean;
}

/**
 * Calculates the required minimum bid amount to take a specific position or the next open slot
 */
export async function calculateMinimumBid(
  categoryId: string,
  targetPosition?: number
): Promise<MinimumPriceCalculation | null> {
  let category: Category | null = null;
  let listings: Listing[] = [];

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: catData } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (catData) category = catData as Category;

    const { data: entryData, error: entryError } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('id, category_id, display_name, tagline, link_url, logo_url, position, current_price, is_paid, is_approved, registered_at, created_at')
      .eq('category_id', categoryId)
      .eq('is_approved', true);

    if (!entryError && entryData) {
      listings = entryData.map((entry) => ({
        id: entry.id,
        category_id: entry.category_id,
        rank_type: 'all_time' as const,
        position: entry.position,
        name: entry.display_name,
        tagline: entry.tagline || '',
        url: entry.link_url || '#',
        logo_url: entry.logo_url,
        current_bid_cents: Math.round(Number(entry.current_price || 0) * 100),
        click_count: 0,
        is_approved: entry.is_approved,
        is_paid: entry.is_paid,
        registered_at: entry.registered_at,
        created_at: entry.created_at,
        updated_at: entry.created_at,
      }));
    } else {
      const { data: listData } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('category_id', categoryId)
        .eq('rank_type', 'all_time')
        .eq('is_approved', true)
        .order('position', { ascending: true });
      if (listData) listings = listData as Listing[];
    }
  } else {
    // In-memory fallback
    category = mockCategories.find((c) => c.id === categoryId || c.slug === categoryId) || null;
    if (category) {
      listings = mockListings
        .filter((l) => l.category_id === category!.id && l.rank_type === 'all_time')
        .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
    }
  }

  if (!category) return null;

  const minFloor = 500;
  const minIncrement = 20;

  // If no position requested or position is 1
  const pos = targetPosition || 1;
  const occupant = listings.find((l) => l.position === pos);

  const paidPrices = new Map(
    listings
      .filter((listing) => listing.position !== null && listing.position >= 1 && listing.position <= 20)
      .map((listing) => [listing.position as number, listing.current_bid_cents])
  );

  const challengePrice = (position: number): number => {
    const currentPrice = paidPrices.get(position);
    if (currentPrice && currentPrice > 0) return Math.round(currentPrice * 1.2);
    if (position === 1) return minFloor;
    return Math.round(challengePrice(position - 1) * 1.2);
  };

  if (occupant) {
    const requiredBid = challengePrice(pos);
    return {
      categoryId: category.id,
      categoryName: category.name_es,
      targetPosition: pos,
      currentBidCents: occupant.current_bid_cents,
      minIncrementCents: minIncrement,
      requiredBidCents: requiredBid,
      occupantName: occupant.name,
      isNewSlot: false,
    };
  }

  // Next open position calculation
  const requiredBid = challengePrice(pos);

  return {
    categoryId: category.id,
    categoryName: category.name_es,
    targetPosition: pos,
    currentBidCents: 0,
    minIncrementCents: minIncrement,
    requiredBidCents: requiredBid,
    occupantName: null,
    isNewSlot: true,
  };
}

/**
 * Re-ranks all listings within a category by current_bid_cents descending
 * Invoked ONLY after a payment is verified.
 */
export async function recalculateCategoryRankings(categoryId: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    // Query active approved listings for this category
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('id, current_bid_cents')
      .eq('category_id', categoryId)
      .eq('rank_type', 'all_time')
      .order('current_bid_cents', { ascending: false });

    if (listings && listings.length > 0) {
      for (let i = 0; i < listings.length; i++) {
        const item = listings[i];
        await supabaseAdmin
          .from('listings')
          .update({
            position: i + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }
  } else {
    // Local mock re-rank
    const catListings = mockListings
      .filter((l) => l.category_id === categoryId && l.rank_type === 'all_time')
      .sort((a, b) => b.current_bid_cents - a.current_bid_cents);

    catListings.forEach((item, index) => {
      item.position = index + 1;
      item.updated_at = new Date().toISOString();
    });
  }
}
