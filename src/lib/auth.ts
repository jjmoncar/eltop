import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured, mockAdminUsers } from '@/lib/supabase/admin';
import { AdminUser } from '@/types/database';

const DEFAULT_SALT = 'e1toplat_admin_salt_2026';
const DEFAULT_HASH = 'cb213ae94ee32956947689fa7e3d7912da9848b3ef00333fb31f7955205b4f4ead5b265ec630f6ad7ea0edb715a173322f7701e35cd6d812bb862962fff02d62';
export const DEFAULT_INITIAL_HASH = `${DEFAULT_SALT}:${DEFAULT_HASH}`;

/**
 * Genera un hash criptográfico PBKDF2-SHA512 con salt aleatorio.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña contra el hash almacenado en formato `salt:hash`.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, expectedHash] = parts;
    if (!salt || !expectedHash) return false;

    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');

    if (expectedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, computedBuf);
  } catch {
    return false;
  }
}

/**
 * Valida que una contraseña cumpla con las políticas de seguridad requeridas:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  message: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} {
  const checks = {
    length: Boolean(password && password.length >= 8),
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[^A-Za-z0-9]/.test(password || ''),
  };

  const errors: string[] = [];
  if (!checks.length) errors.push('mínimo 8 caracteres');
  if (!checks.uppercase) errors.push('al menos una letra mayúscula');
  if (!checks.lowercase) errors.push('al menos una letra minúscula');
  if (!checks.number) errors.push('al menos un número');
  if (!checks.special) errors.push('al menos un carácter especial (ej. !@#$%^&*)');

  return {
    isValid: errors.length === 0,
    errors,
    message:
      errors.length === 0
        ? ''
        : `La contraseña debe cumplir: ${errors.join(', ')}.`,
    checks,
  };
}

/**
 * Obtiene la clave de firma de sesiones administrativas.
 */
function getSigningKey(): string {
  return process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eltop-lat-session-secret-key';
}

/**
 * Crea un token de sesión firmado para un usuario administrativo (duración 7 días).
 */
export function createAdminSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 7 * 24 * 3600 * 1000,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSigningKey())
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Verifica la firma y expiración de un token de sesión administrativa.
 */
export function verifyAdminSessionToken(token: string): { uid: string; email: string; name: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', getSigningKey())
      .update(`${header}.${payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || !decoded.uid || !decoded.exp || Date.now() > decoded.exp) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Asegura que exista al menos un usuario administrador en la base de datos Supabase.
 * Si la tabla está vacía, inserta el admin por defecto.
 */
export async function ensureDefaultAdminUserInDB(): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;
  try {
    const { count, error } = await supabaseAdmin
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === null || count === 0)) {
      await supabaseAdmin.from('admin_users').insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@eltop.lat',
        password_hash: DEFAULT_INITIAL_HASH,
        name: 'Administrador Principal',
        role: 'superadmin',
        is_active: true,
      });
      console.log('[SUPABASE] Usuario inicial admin@eltop.lat creado con éxito.');
    }
  } catch (err) {
    console.error('Error auto-seeding default admin in Supabase:', err);
  }
}

export interface AuthValidationResult {
  isValid: boolean;
  user?: AdminUser | null;
  isMasterKey?: boolean;
}

/**
 * Valida de forma integral la petición administrativa:
 * 1. Primero verifica si el token Bearer corresponde a una sesión de usuario válida en la BD.
 * 2. Si no es sesión, verifica si corresponde a la clave maestra ADMIN_SECRET_KEY.
 */
export async function validateAdminRequest(req: NextRequest): Promise<AuthValidationResult> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { isValid: false };
  }

  const providedToken = authHeader.slice(7).trim();
  if (!providedToken) {
    return { isValid: false };
  }

  // 1. Intentar validar como token de sesión JWT de usuario administrativo
  const sessionData = verifyAdminSessionToken(providedToken);
  if (sessionData) {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: dbUser, error } = await supabaseAdmin
          .from('admin_users')
          .select('id, email, name, role, is_active, created_at, last_login')
          .eq('id', sessionData.uid)
          .single();

        if (!error && dbUser && dbUser.is_active) {
          return {
            isValid: true,
            user: dbUser as AdminUser,
          };
        }

        // Si la consulta a la BD falla por error de red/esquema pero el token JWT está válidamente firmado:
        if (error) {
          console.warn('[AUTH SESSION] Supabase query returned error, using verified session payload:', error.message);
          return {
            isValid: true,
            user: {
              id: sessionData.uid,
              email: sessionData.email,
              name: sessionData.name,
              role: (sessionData.role as 'superadmin' | 'admin' | 'moderator') || 'admin',
              is_active: true,
              created_at: new Date().toISOString(),
            },
          };
        }
      } catch (err) {
        console.error('Error validating admin user session against Supabase:', err);
      }
    } else {
      // Modo local fallback
      const mockUser = mockAdminUsers.find((u) => u.id === sessionData.uid);
      if (mockUser && mockUser.is_active) {
        return {
          isValid: true,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            is_active: mockUser.is_active,
            created_at: mockUser.created_at,
            last_login: mockUser.last_login,
          },
        };
      }
    }
  }

  // 2. Fallback: Validar como clave maestra ADMIN_SECRET_KEY
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  const expectedSecret = adminSecret || (isProduction ? '' : 'admin123');

  if (expectedSecret) {
    try {
      const expectedBuf = Buffer.from(expectedSecret, 'utf8');
      const providedBuf = Buffer.from(providedToken, 'utf8');

      if (expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)) {
        return {
          isValid: true,
          isMasterKey: true,
          user: {
            id: 'master-key-user',
            email: 'master@eltop.lat',
            name: 'Clave Maestra',
            role: 'superadmin',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        };
      }
    } catch {
      // Continue to reject
    }
  }

  return { isValid: false };
}
