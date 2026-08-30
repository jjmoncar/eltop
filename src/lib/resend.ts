import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const isResendConfigured = Boolean(resendApiKey && !resendApiKey.includes('placeholder'));

export const resend = isResendConfigured ? new Resend(resendApiKey) : null;

export async function sendBidConfirmationEmail({
  to,
  buyerName,
  listingName,
  position,
  amountPaidUsd,
  categoryName,
}: {
  to: string;
  buyerName: string;
  listingName: string;
  position: number;
  amountPaidUsd: number;
  categoryName: string;
}) {
  if (!resend) {
    console.log(`[Email Mock] Confirmation sent to ${to} for #${position} in ${categoryName}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notificaciones@eltop.lat',
      to,
      subject: `🎉 ¡Tu puesto #${position} en eltop.lat está activo!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0b0f17; color: #ffffff; border-radius: 12px;">
          <h1 style="color: #f59e0b; margin-bottom: 8px;">¡Felicitaciones, ${buyerName}!</h1>
          <p style="font-size: 16px; color: #94a3b8;">Tu proyecto <strong>${listingName}</strong> acaba de reclamar el puesto <strong>#${position}</strong> en la categoría <strong>${categoryName}</strong> de eltop.lat.</p>
          
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #cbd5e1;"><strong>Monto invertido:</strong> $${amountPaidUsd} USD</p>
            <p style="margin: 4px 0; color: #cbd5e1;"><strong>Puesto alcanzado:</strong> #${position}</p>
            <p style="margin: 4px 0; color: #cbd5e1;"><strong>Tracking de clics:</strong> Activo de inmediato</p>
          </div>

          <p style="color: #94a3b8; font-size: 14px;">Podrás monitorear tus clics y posiciones en vivo desde <a href="https://eltop.lat" style="color: #38bdf8;">eltop.lat</a>.</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">eltop.lat — El leaderboard de subasta para los mejores proyectos de LATAM.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending confirmation email via Resend:', error);
    return { success: false, error };
  }
}
