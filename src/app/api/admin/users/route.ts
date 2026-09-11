import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, mockAdminUsers } from '@/lib/supabase/admin';
import { validateAdminRequest, hashPassword, validatePasswordStrength, ensureDefaultAdminUserInDB } from '@/lib/auth';
import { AdminUser } from '@/types/database';

export async function GET(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      await ensureDefaultAdminUserInDB();

      const { data: users, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, name, role, is_active, created_at, last_login')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ users: users || [] });
    }

    const safeMockUsers = mockAdminUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      last_login: u.last_login,
    }));

    return NextResponse.json({ users: safeMockUsers });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Error al consultar usuarios administrativos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  if (auth.user?.role !== 'superadmin' && auth.user?.role !== 'admin' && !auth.isMasterKey) {
    return NextResponse.json({ error: 'Permisos insuficientes para crear administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, password, role = 'admin' } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Todos los campos (correo, nombre, contraseña) son obligatorios.' }, { status: 400 });
    }

    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.isValid) {
      return NextResponse.json({ error: pwdValidation.message }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const passwordHash = hashPassword(password);

    if (isSupabaseConfigured && supabaseAdmin) {
      // Verificar si ya existe
      const { data: existing } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', cleanEmail)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Ya existe un administrador con este correo electrónico.' }, { status: 409 });
      }

      const { data: newUser, error } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: cleanEmail,
          name: cleanName,
          password_hash: passwordHash,
          role,
          is_active: true,
        })
        .select('id, email, name, role, is_active, created_at, last_login')
        .single();

      if (error || !newUser) {
        console.error('Database user creation error:', error);
        return NextResponse.json({ error: 'Error al guardar el usuario en la base de datos.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: newUser });
    } else {
      // Mock mode
      const exists = mockAdminUsers.some((u) => u.email === cleanEmail);
      if (exists) {
        return NextResponse.json({ error: 'Ya existe un administrador con este correo electrónico.' }, { status: 409 });
      }

      const newMockUser = {
        id: `admin_${Date.now()}`,
        email: cleanEmail,
        name: cleanName,
        password_hash: passwordHash,
        role: role as 'superadmin' | 'admin' | 'moderator',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null,
      };

      mockAdminUsers.push(newMockUser);

      return NextResponse.json({
        success: true,
        user: {
          id: newMockUser.id,
          email: newMockUser.email,
          name: newMockUser.name,
          role: newMockUser.role,
          is_active: newMockUser.is_active,
          created_at: newMockUser.created_at,
          last_login: newMockUser.last_login,
        },
      });
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Error al crear usuario administrador' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, name, email, isActive, role, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Verificar si otro usuario ya usa este correo
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data: existingEmail } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('email', cleanEmail)
          .neq('id', userId)
          .maybeSingle();

        if (existingEmail) {
          return NextResponse.json({ error: 'Ya existe otro administrador con este correo electrónico.' }, { status: 409 });
        }
      } else {
        const emailExists = mockAdminUsers.some((u) => u.email === cleanEmail && u.id !== userId);
        if (emailExists) {
          return NextResponse.json({ error: 'Ya existe otro administrador con este correo electrónico.' }, { status: 409 });
        }
      }
      updates.email = cleanEmail;
    }

    if (typeof isActive === 'boolean') {
      updates.is_active = isActive;
    }

    if (role && ['admin', 'moderator', 'superadmin'].includes(role)) {
      updates.role = role;
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
      const pwdValidation = validatePasswordStrength(newPassword);
      if (!pwdValidation.isValid) {
        return NextResponse.json({ error: pwdValidation.message }, { status: 400 });
      }
      updates.password_hash = hashPassword(newPassword);
    }

    let updatedUser: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('admin_users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, name, role, is_active, created_at, last_login')
        .single();

      if (error) throw error;
      updatedUser = updated;
    } else {
      const user = mockAdminUsers.find((u) => u.id === userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        if (typeof updates.is_active === 'boolean') user.is_active = updates.is_active;
        if (updates.role) user.role = updates.role;
        if (updates.password_hash) user.password_hash = updates.password_hash;
        updatedUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          last_login: user.last_login,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado con éxito.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    // Evitar auto-eliminación
    if (auth.user?.id === userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de administrador mientras estás conectado.' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } else {
      const index = mockAdminUsers.findIndex((u) => u.id === userId);
      if (index >= 0) {
        mockAdminUsers.splice(index, 1);
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
