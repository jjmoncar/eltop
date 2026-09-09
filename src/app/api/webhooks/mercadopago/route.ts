import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, mockBids, mockListings, mockCategories, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getPaymentDetails } from '@/lib/mercadopago';
import { recalculateCategoryRankings } from '@/lib/auction';
import { sendBidConfirmationEmail } from '@/lib/resend';
import { Bid, Listing } from '@/types/database';

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

    // 2. Check if a listing with the same target_url or buyer email exists in this category, or create new
    const { data: existingListing } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('category_id', targetBid.category_id)
      .eq('url', targetBid.target_url)
      .single();

    let listingId = existingListing?.id;

    if (existingListing) {
      // Update existing listing
      await supabaseAdmin
        .from('listings')
        .update({
          name: targetBid.target_name,
          tagline: targetBid.tagline,
          logo_url: targetBid.logo_url || existingListing.logo_url,
          current_bid_cents: targetBid.bid_amount_cents,
          email: targetBid.buyer_email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingListing.id);
    } else {
      // Create new listing
      const { data: newListing } = await supabaseAdmin
        .from('listings')
        .insert({
          category_id: targetBid.category_id,
          rank_type: 'all_time',
          position: 999, // Will be updated immediately below
          name: targetBid.target_name,
          tagline: targetBid.tagline,
          url: targetBid.target_url,
          logo_url: targetBid.logo_url,
          email: targetBid.buyer_email,
          current_bid_cents: targetBid.bid_amount_cents,
          click_count: 0,
          is_approved: true,
        })
        .select()
        .single();

      if (newListing) {
        listingId = newListing.id;
        await supabaseAdmin
          .from('bids')
          .update({ listing_id: listingId })
          .eq('id', targetBid.id);
      }
    }

    // 3. Recalculate rankings atomically
    await recalculateCategoryRankings(targetBid.category_id);

    // 4. Fetch updated position for email
    const { data: finalListing } = await supabaseAdmin
      .from('listings')
      .select('position')
      .eq('id', listingId)
      .single();

    // 5. Send confirmation email
    await sendBidConfirmationEmail({
      to: targetBid.buyer_email,
      buyerName: targetBid.buyer_name,
      listingName: targetBid.target_name,
      position: finalListing?.position || 1,
      amountPaidUsd: targetBid.bid_amount_cents / 100,
      categoryName: (targetBid.category as any)?.name_es || 'General',
    });
  } else {
    // In-memory fallback
    targetBid = mockBids.find((b) => b.id === bidId) || null;
    if (!targetBid || targetBid.payment_status === 'paid') return;

    targetBid.payment_status = 'paid';
    targetBid.payment_id = paymentId;

    const existingIndex = mockListings.findIndex(
      (l) => l.category_id === targetBid!.category_id && l.url === targetBid!.target_url
    );

    let listingId = '';
    if (existingIndex >= 0) {
      mockListings[existingIndex].name = targetBid.target_name;
      mockListings[existingIndex].tagline = targetBid.tagline;
      mockListings[existingIndex].current_bid_cents = targetBid.bid_amount_cents;
      mockListings[existingIndex].logo_url = targetBid.logo_url || mockListings[existingIndex].logo_url;
      mockListings[existingIndex].updated_at = new Date().toISOString();
      listingId = mockListings[existingIndex].id;
    } else {
      listingId = `list_${Date.now()}`;
      const newListing: Listing = {
        id: listingId,
        category_id: targetBid.category_id,
        rank_type: 'all_time',
        position: 999,
        name: targetBid.target_name,
        tagline: targetBid.tagline,
        url: targetBid.target_url,
        logo_url: targetBid.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=faces',
        email: targetBid.buyer_email,
        current_bid_cents: targetBid.bid_amount_cents,
        click_count: 0,
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockListings.push(newListing);
    }

    targetBid.listing_id = listingId;
    await recalculateCategoryRankings(targetBid.category_id);

    const cat = mockCategories.find((c) => c.id === targetBid!.category_id);
    const finalItem = mockListings.find((l) => l.id === listingId);

    await sendBidConfirmationEmail({
      to: targetBid.buyer_email,
      buyerName: targetBid.buyer_name,
      listingName: targetBid.target_name,
      position: finalItem?.position || 1,
      amountPaidUsd: targetBid.bid_amount_cents / 100,
      categoryName: cat?.name_es || 'General',
    });
  }
}
