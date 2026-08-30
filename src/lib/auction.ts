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

    const { data: listData } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('category_id', categoryId)
      .eq('rank_type', 'all_time')
      .eq('is_approved', true)
      .order('position', { ascending: true });

    if (listData) listings = listData as Listing[];
  } else {
    // In-memory fallback
    category = mockCategories.find((c) => c.id === categoryId || c.slug === categoryId) || null;
    if (category) {
      listings = mockListings
        .filter((l) => l.category_id === category!.id && l.rank_type === 'all_time')
        .sort((a, b) => a.position - b.position);
    }
  }

  if (!category) return null;

  const minFloor = category.min_floor_cents || 2000;
  const minIncrement = category.min_bid_increment_cents || 500;

  // If no position requested or position is 1
  const pos = targetPosition || 1;
  const occupant = listings.find((l) => l.position === pos);

  if (occupant) {
    // Target position is occupied: Must outbid by min increment
    const requiredBid = occupant.current_bid_cents + minIncrement;
    return {
      categoryId: category.id,
      categoryName: category.name_es,
      targetPosition: pos,
      currentBidCents: occupant.current_bid_cents,
      minIncrementCents: minIncrement,
      requiredBidCents: Math.max(requiredBid, minFloor),
      occupantName: occupant.name,
      isNewSlot: false,
    };
  }

  // Next open position calculation
  const highestBid = listings.length > 0 ? listings[listings.length - 1].current_bid_cents : 0;
  const requiredBid = listings.length === 0 ? minFloor : Math.max(minFloor, Math.floor(highestBid * 0.5));

  return {
    categoryId: category.id,
    categoryName: category.name_es,
    targetPosition: listings.length + 1,
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
