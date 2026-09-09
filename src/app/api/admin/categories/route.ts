import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, mockCategories, mockListings } from '@/lib/supabase/admin';
import { validateAdminRequest } from '@/lib/auth';
import { Category } from '@/types/database';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '');        // remove leading/trailing hyphens
}

export async function GET(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Obtener conteo de listados por categoría
      const { data: listings } = await supabaseAdmin
        .from('listings')
        .select('category_id');

      const counts: Record<string, number> = {};
      (listings || []).forEach((l: { category_id: string }) => {
        counts[l.category_id] = (counts[l.category_id] || 0) + 1;
      });

      const categoriesWithCount = (categories || []).map((cat: Category) => ({
        ...cat,
        listings_count: counts[cat.id] || 0,
      }));

      return NextResponse.json({ categories: categoriesWithCount });
    }

    // Modo local / mock
    const categoriesWithCount = mockCategories.map((cat) => ({
      ...cat,
      listings_count: mockListings.filter((l) => l.category_id === cat.id).length,
    }));

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error: any) {
    console.error('Error fetching admin categories:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al obtener categorías.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name_es,
      name_pt,
      slug: customSlug,
      description_es,
      description_pt,
      min_floor_cents = 2000,
      min_bid_increment_cents = 500,
      icon = 'Layers',
    } = body;

    if (!name_es || !name_es.trim()) {
      return NextResponse.json(
        { error: 'El nombre en español (name_es) es obligatorio.' },
        { status: 400 }
      );
    }

    const cleanNameEs = name_es.trim();
    const cleanNamePt = (name_pt && name_pt.trim()) || cleanNameEs;
    const cleanSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(cleanNameEs);

    if (!cleanSlug) {
      return NextResponse.json(
        { error: 'El slug generado no es válido.' },
        { status: 400 }
      );
    }

    const floorCents = Math.max(100, parseInt(String(min_floor_cents), 10) || 2000);
    const incrementCents = Math.max(100, parseInt(String(min_bid_increment_cents), 10) || 500);

    if (isSupabaseConfigured && supabaseAdmin) {
      // Verificar si el slug ya existe
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', cleanSlug)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: `Ya existe una categoría con el slug "${cleanSlug}". Usa uno diferente.` },
          { status: 409 }
        );
      }

      const { data: newCategory, error } = await supabaseAdmin
        .from('categories')
        .insert({
          slug: cleanSlug,
          name_es: cleanNameEs,
          name_pt: cleanNamePt,
          description_es: description_es?.trim() || null,
          description_pt: description_pt?.trim() || description_es?.trim() || null,
          min_floor_cents: floorCents,
          min_bid_increment_cents: incrementCents,
          icon: icon.trim() || 'Layers',
        })
        .select('*')
        .single();

      if (error || !newCategory) {
        throw error || new Error('No se pudo insertar la categoría en la base de datos.');
      }

      return NextResponse.json({
        success: true,
        category: { ...newCategory, listings_count: 0 },
      });
    }

    // Modo Mock
    if (mockCategories.some((c) => c.slug === cleanSlug)) {
      return NextResponse.json(
        { error: `Ya existe una categoría con el slug "${cleanSlug}".` },
        { status: 409 }
      );
    }

    const mockCat: Category = {
      id: `cat_${Date.now()}`,
      slug: cleanSlug,
      name_es: cleanNameEs,
      name_pt: cleanNamePt,
      description_es: description_es?.trim() || null,
      description_pt: description_pt?.trim() || null,
      min_floor_cents: floorCents,
      min_bid_increment_cents: incrementCents,
      icon: icon.trim() || 'Layers',
      created_at: new Date().toISOString(),
    };

    mockCategories.push(mockCat);

    return NextResponse.json({
      success: true,
      category: { ...mockCat, listings_count: 0 },
    });
  } catch (error: any) {
    console.error('Error creating admin category:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al crear la categoría.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name_es, name_pt, slug: newSlug, description_es, description_pt, min_floor_cents, min_bid_increment_cents, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id de la categoría.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (name_es !== undefined) updates.name_es = name_es.trim();
    if (name_pt !== undefined) updates.name_pt = name_pt.trim();
    if (description_es !== undefined) updates.description_es = description_es ? description_es.trim() : null;
    if (description_pt !== undefined) updates.description_pt = description_pt ? description_pt.trim() : null;
    if (icon !== undefined) updates.icon = icon.trim() || 'Layers';

    if (min_floor_cents !== undefined) {
      updates.min_floor_cents = Math.max(100, parseInt(String(min_floor_cents), 10) || 2000);
    }

    if (min_bid_increment_cents !== undefined) {
      updates.min_bid_increment_cents = Math.max(100, parseInt(String(min_bid_increment_cents), 10) || 500);
    }

    if (newSlug !== undefined) {
      const cleanSlug = slugify(newSlug);
      if (!cleanSlug) {
        return NextResponse.json({ error: 'El slug proporcionado no es válido.' }, { status: 400 });
      }
      updates.slug = cleanSlug;
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      // Si se cambia el slug, verificar que no colisione con otra categoría
      if (updates.slug) {
        const { data: existing } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', updates.slug)
          .neq('id', id)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: `El slug "${updates.slug}" ya pertenece a otra categoría.` },
            { status: 409 }
          );
        }
      }

      const { data: updatedCat, error } = await supabaseAdmin
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !updatedCat) {
        throw error || new Error('No se pudo actualizar la categoría.');
      }

      return NextResponse.json({ success: true, category: updatedCat });
    }

    // Modo Mock
    const catIndex = mockCategories.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    Object.assign(mockCategories[catIndex], updates);

    return NextResponse.json({ success: true, category: mockCategories[catIndex] });
  } catch (error: any) {
    console.error('Error updating admin category:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al actualizar la categoría.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await validateAdminRequest(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el id de la categoría a eliminar.' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      // Verificar que no sea la única categoría activa
      const { count } = await supabaseAdmin
        .from('categories')
        .select('*', { count: 'exact', head: true });

      if (count !== null && count <= 1) {
        return NextResponse.json(
          { error: 'No puedes eliminar la única categoría existente en la plataforma.' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Categoría eliminada con éxito de la base de datos.',
      });
    }

    // Modo Mock
    if (mockCategories.length <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar la única categoría existente.' },
        { status: 400 }
      );
    }

    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      mockCategories.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada con éxito.',
    });
  } catch (error: any) {
    console.error('Error deleting admin category:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al eliminar la categoría.' },
      { status: 500 }
    );
  }
}
