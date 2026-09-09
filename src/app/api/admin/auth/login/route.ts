import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, mockAdminUsers } from '@/lib/supabase/admin';
import {
  verifyPassword,
  createAdminSessionToken,
  ensureDefaultAdminUserInDB,
  DEFAULT_INITIAL_HASH,
} from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, secretKey } = body;

    // 1. Acceso mediante correo y contraseña contra la base de datos
    if (email && password) {
      const cleanEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured && supabaseAdmin) {
        // Asegurar que exista el usuario inicial si la BD está limpia
        await ensureDefaultAdminUserInDB();

        const { data: user, error } = await supabaseAdmin
          .from('admin_users')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (error || !user) {
          return NextResponse.json(
            { error: 'Usuario administrador no encontrado.' },
            { status: 401 }
          );
        }

        if (!user.is_active) {
          return NextResponse.json(
            { error: 'Esta cuenta administrativa ha sido desactivada por un administrador.' },
            { status: 403 }
          );
        }

        const isMatch = verifyPassword(password, user.password_hash);
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Contraseña incorrecta.' },
            { status: 401 }
          );
        }

        // Actualizar último inicio de sesión en la base de datos
        await supabaseAdmin
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        const token = createAdminSessionToken(user);

        return NextResponse.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            last_login: user.last_login,
          },
        });
      } else {
        // Modo local in-memory fallback
        const mockUser = mockAdminUsers.find((u) => u.email === cleanEmail);
        if (!mockUser) {
          return NextResponse.json(
            { error: 'Usuario administrador no encontrado en almacén local.' },
            { status: 401 }
          );
        }

        if (!mockUser.is_active) {
          return NextResponse.json(
            { error: 'Cuenta administrativa desactivada.' },
            { status: 403 }
          );
        }

        const isMatch = verifyPassword(password, mockUser.password_hash);
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Contraseña incorrecta.' },
            { status: 401 }
          );
        }

        mockUser.last_login = new Date().toISOString();
        const token = createAdminSessionToken(mockUser);

        return NextResponse.json({
          success: true,
          token,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            last_login: mockUser.last_login,
          },
        });
      }
    }

    // 2. Acceso alternativo por Clave Maestra de emergencia
    if (secretKey) {
      const adminSecret = process.env.ADMIN_SECRET_KEY;
      const isProduction = process.env.NODE_ENV === 'production';
      const expectedSecret = adminSecret || (isProduction ? '' : 'admin123');

      if (expectedSecret) {
        try {
          const expBuf = Buffer.from(expectedSecret, 'utf8');
          const provBuf = Buffer.from(secretKey.trim(), 'utf8');

          if (expBuf.length === provBuf.length && crypto.timingSafeEqual(expBuf, provBuf)) {
            return NextResponse.json({
              success: true,
              token: secretKey.trim(),
              user: {
                id: 'master-key',
                email: 'master@eltop.lat',
                name: 'Clave Maestra (API Key)',
                role: 'superadmin',
                last_login: new Date().toISOString(),
              },
            });
          }
        } catch {
          // Failure
        }
      }
      return NextResponse.json({ error: 'Clave maestra inválida.' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Debes proporcionar correo y contraseña o tu clave maestra.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in /api/admin/auth/login:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el inicio de sesión.' },
      { status: 500 }
    );
  }
}
