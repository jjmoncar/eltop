import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, mockBids, isSupabaseConfigured } from '@/lib/supabase/admin';
import { calculateMinimumBid } from '@/lib/auction';
import { sanitizeText, validateListingInput, checkRateLimit } from '@/lib/anti-abuse';
import { Bid } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      tagline,
      url,
      logoUrl,
      buyerName,
      buyerEmail,
      bidAmountCents,
      paymentProvider = 'paypal',
      country = 'BR',
      docType = 'CPF',
      docNumber = '',
    } = body;

    // 1. Validate inputs
    const validation = validateListingInput({
      name,
      tagline,
      url,
      email: buyerEmail,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Validate price against minimum required
    const priceCalc = await calculateMinimumBid(categoryId);
    if (!priceCalc) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    const offeredCents = parseInt(bidAmountCents, 10);
    if (isNaN(offeredCents) || offeredCents < priceCalc.requiredBidCents) {
      return NextResponse.json(
        {
          error: `El monto mínimo para entrar en esta categoría es de $${(priceCalc.requiredBidCents / 100).toFixed(2)} USD.`,
          requiredBidCents: priceCalc.requiredBidCents,
        },
        { status: 400 }
      );
    }

    // 3. Sanitize
    const cleanName = sanitizeText(name);
    const cleanTagline = sanitizeText(tagline);
    const cleanBuyerName = sanitizeText(buyerName || name);
    const cleanLogoUrl = logoUrl ? sanitizeText(logoUrl) : null;
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    let createdBidId = `bid_${Date.now()}`;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: newBid, error: dbError } = await supabaseAdmin
        .from('bids')
        .insert({
          category_id: categoryId,
          bid_amount_cents: offeredCents,
          buyer_name: cleanBuyerName,
          buyer_email: buyerEmail.trim().toLowerCase(),
          target_name: cleanName,
          tagline: cleanTagline,
          target_url: targetUrl,
          logo_url: cleanLogoUrl,
          payment_provider: paymentProvider,
          payment_status: 'pending',
          raw_payment_data: {
            country,
            doc_type: docType,
            doc_number: docNumber,
          },
        })
        .select()
        .single();

      if (dbError || !newBid) {
        console.error('Database bid creation error:', dbError);
        return NextResponse.json(
          { error: 'Error al registrar la puja en la base de datos.' },
          { status: 500 }
        );
      }

      createdBidId = newBid.id;
    } else {
      // Local mock storage
      const mockBid: Bid = {
        id: createdBidId,
        category_id: categoryId,
        bid_amount_cents: offeredCents,
        buyer_name: cleanBuyerName,
        buyer_email: buyerEmail.trim().toLowerCase(),
        target_name: cleanName,
        tagline: cleanTagline,
        target_url: targetUrl,
        logo_url: cleanLogoUrl,
        payment_provider: paymentProvider,
        payment_status: 'pending',
        raw_payment_data: {
          country,
          doc_type: docType,
          doc_number: docNumber,
        },
        created_at: new Date().toISOString(),
      };
      mockBids.unshift(mockBid);
    }

    return NextResponse.json({
      success: true,
      bidId: createdBidId,
      bidAmountCents: offeredCents,
      requiredBidCents: priceCalc.requiredBidCents,
      categoryName: priceCalc.categoryName,
    });
  } catch (error) {
    console.error('Error in /api/bids/create:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar la puja.' },
      { status: 500 }
    );
  }
}
