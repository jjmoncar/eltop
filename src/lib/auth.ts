import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Valida de forma segura (timing-safe) si la petición contiene la clave de administrador
 * en el header: `Authorization: Bearer <ADMIN_SECRET_KEY>`.
 */
export function validateAdminRequest(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  // En producción es obligatorio definir ADMIN_SECRET_KEY y no se permite usar el valor por defecto
  if (!adminSecret) {
    if (isProduction) {
      console.error('[SEGURIDAD] ADMIN_SECRET_KEY no está configurada en producción.');
      return false;
    }
  }

  const expectedSecret = adminSecret || (isProduction ? '' : 'admin123');
  if (!expectedSecret) {
    return false;
  }

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
  if (!providedToken) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(expectedSecret, 'utf8');
    const providedBuf = Buffer.from(providedToken, 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
