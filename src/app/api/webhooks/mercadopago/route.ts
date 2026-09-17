import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, mockBids, mockLeaderboardEntries, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getPaymentDetails } from '@/lib/mercadopago';
import { sendBidConfirmationEmail } from '@/lib/resend';
import { Bid } from '@/types/database';

function verifyMercadoPagoSignature(req: NextRequest, dataId?: string | null): boolean {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SEGURIDAD] MERCADOPAGO_WEBHOOK_SECRET no está configurada.');
    }
    return true;
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature) {
    console.error('[SEGURIDAD] Falta encabezado x-signature en webhook de Mercado Pago.');
    return false;
  }

  const parts = xSignature.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = parts['ts'];
  const hash = parts['v1'];

  if (!ts || !hash) {
    console.error('[SEGURIDAD] Formato inválido de x-signature en webhook.');
    return false;
  }

  const manifest = `id:${dataId || ''};request-id:${xRequestId || ''};ts:${ts};`;
  const computedHash = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

  try {
    const expectedBuf = Buffer.from(computedHash, 'utf8');
    const providedBuf = Buffer.from(hash, 'utf8');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Mercado Pago sends payment notification ID via query param or body
    const paymentId =
      url.searchParams.get('data.id') ||
      url.searchParams.get('id') ||
      body.data?.id ||
      body.id;

    // Verificar firma criptográfica si la clave secreta está configurada
    if (!verifyMercadoPagoSignature(req, paymentId)) {
      return NextResponse.json({ error: 'Firma de webhook no válida' }, { status: 401 });
    }

    const topic = url.searchParams.get('type') || url.searchParams.get('topic') || body.type || body.topic;

    if (!paymentId && topic !== 'payment') {
      return NextResponse.json({ received: true, note: 'Ignored non-payment webhook' });
    }

    let externalRef = '';
    let isApproved = false;
    let paymentData: any = null;

    if (paymentId) {
      paymentData = await getPaymentDetails(paymentId);
      if (paymentData) {
        externalRef = paymentData.external_reference;
        isApproved = paymentData.status === 'approved';
      }
    }

    if (!externalRef) {
      return NextResponse.json({ received: true, note: 'No external_reference found' });
    }

    // Solo activar si el pago fue aprobado
    if (!isApproved) {
      return NextResponse.json({ received: true, note: `Payment status is ${paymentData?.status || 'unknown'}` });
    }

    // Process the bid
    await processSuccessfulBid(externalRef, paymentId || 'webhook_mp', paymentData);

    return NextResponse.json({ success: true, processedBidId: externalRef });
  } catch (error) {
    console.error('Error handling Mercado Pago webhook:', error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}

export async function processSuccessfulBid(bidId: string, paymentId: string, paymentData?: any) {
  let targetBid: Bid | null = null;

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: bid } = await supabaseAdmin
      .from('bids')
      .select('*, categories(*)')
      .eq('id', bidId)
      .single();

    if (!bid || bid.payment_status === 'paid') return;
    targetBid = bid as Bid;

    // 1. Mark bid as paid
    await supabaseAdmin
      .from('bids')
      .update({
        payment_status: 'paid',
        payment_id: paymentId,
        raw_payment_data: paymentData || {},
      })
      .eq('id', bidId);

    // 2. Create or reuse the freemium entry, then place the paid bid atomically.
    const { data: existingEntry } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('id, logo_url')
      .eq('category_id', targetBid.category_id)
      .eq('link_url', targetBid.target_url)
      .maybeSingle();

    const { data: entry, error: entryError } = existingEntry
      ? { data: existingEntry, error: null }
      : await supabaseAdmin
          .from('leaderboard_entries')
          .insert({
            category_id: targetBid.category_id,
            display_name: targetBid.target_name,
            tagline: targetBid.tagline,
            link_url: targetBid.target_url,
            logo_url: targetBid.logo_url,
            is_approved: true,
          })
          .select('id, logo_url')
          .single();

    if (entryError || !entry) throw entryError || new Error('Could not create leaderboard entry');

    const { error: urlClaimError } = await supabaseAdmin.rpc('claim_listing_url', {
      p_url: targetBid.target_url,
      p_entry_id: entry.id,
    });
    if (urlClaimError) {
      if (!existingEntry) await supabaseAdmin.from('leaderboard_entries').delete().eq('id', entry.id);
      throw urlClaimError;
    }

    const targetPosition = Math.min(Math.max(targetBid.target_position || 1, 1), 20);
    const { data: placement, error: placementError } = await supabaseAdmin.rpc('place_bid', {
      p_entry_id: entry.id,
      p_category_id: targetBid.category_id,
      p_position: targetPosition,
      p_amount: targetBid.bid_amount_cents / 100,
      p_bidder_id: null,
    });

    if (placementError || !placement?.success) {
      throw placementError || new Error(`Bid no longer meets the required price of $${placement?.required_price || 'unknown'} USD.`);
    }

    await supabaseAdmin.from('bids').update({ entry_id: entry.id }).eq('id', targetBid.id);

    // 5. Send confirmation email
    await sendBidConfirmationEmail({
      to: targetBid.buyer_email,
      buyerName: targetBid.buyer_name,
      listingName: targetBid.target_name,
      position: targetPosition,
      amountPaidUsd: targetBid.bid_amount_cents / 100,
      categoryName: (targetBid.category as any)?.name_es || 'General',
    });
  } else {
    // In-memory fallback
    targetBid = mockBids.find((b) => b.id === bidId) || null;
    if (!targetBid || targetBid.payment_status === 'paid') return;

    targetBid.payment_status = 'paid';
    targetBid.payment_id = paymentId;

    let entry = mockLeaderboardEntries.find(
      (item) => item.category_id === targetBid!.category_id && item.link_url === targetBid!.target_url
    );
    if (!entry) {
      entry = {
        id: `entry_${Date.now()}`,
        category_id: targetBid.category_id,
        display_name: targetBid.target_name,
        tagline: targetBid.tagline,
        link_url: targetBid.target_url,
        logo_url: targetBid.logo_url,
        position: null,
        current_price: null,
        is_paid: false,
        is_approved: true,
        click_count: 0,
        registered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockLeaderboardEntries.push(entry);
    }

    const targetPosition = Math.min(Math.max(targetBid.target_position || 1, 1), 20);
    const entriesInCategory = mockLeaderboardEntries.filter((item) => item.category_id === targetBid!.category_id);
    const priceAt = (position: number): number => {
      const occupied = entriesInCategory.find((item) => item.position === position && item.current_price);
      if (occupied?.current_price) return Number((occupied.current_price * 1.2).toFixed(2));
      if (position === 1) return 5;
      return Number((priceAt(position - 1) * 1.2).toFixed(2));
    };
    const requiredPrice = priceAt(targetPosition);
    if (targetBid.bid_amount_cents / 100 < requiredPrice) {
      throw new Error(`Bid no longer meets the required price of $${requiredPrice.toFixed(2)} USD.`);
    }
    const displaced = entriesInCategory.find((item) => item.position === targetPosition);
    if (displaced && displaced.id !== entry.id) {
      displaced.position = null;
      displaced.current_price = null;
      displaced.is_paid = false;
    }
    entry.position = targetPosition;
    entry.current_price = targetBid.bid_amount_cents / 100;
    entry.is_paid = true;
    entry.last_bid_at = new Date().toISOString();
    targetBid.entry_id = entry.id;

    const cat = mockCategories.find((c) => c.id === targetBid!.category_id);
    await sendBidConfirmationEmail({
      to: targetBid.buyer_email,
      buyerName: targetBid.buyer_name,
      listingName: targetBid.target_name,
      position: targetPosition,
      amountPaidUsd: targetBid.bid_amount_cents / 100,
      categoryName: cat?.name_es || 'General',
    });
  }
}
