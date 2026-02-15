import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getUserPreferences, setUserPreferences } from '@/lib/firestore';

/**
 * GET /api/users/me/preferences
 * Obtiene las preferencias del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const { dbUser } = await requireAuth(request);
    const prefs = await getUserPreferences(dbUser.id);
    const defaults = {
      notifications: { email: true, whatsapp: false, studyReady: true },
      language: 'es',
    };
    return NextResponse.json(prefs ?? { userId: dbUser.id, ...defaults, updatedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    console.error('[Preferences GET]', e);
    return NextResponse.json({ error: 'Error al cargar preferencias' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/me/preferences
 * Actualiza las preferencias del usuario autenticado
 */
export async function PATCH(request: NextRequest) {
  try {
    const { dbUser } = await requireAuth(request);
    const body = await request.json();
    const { notifications, language } = body;
    const updates: Record<string, unknown> = {};
    if (typeof notifications === 'object') {
      updates.notifications = {
        email: Boolean(notifications.email),
        whatsapp: Boolean(notifications.whatsapp),
        studyReady: Boolean(notifications.studyReady),
      };
    }
    if (typeof language === 'string') updates.language = language;
    await setUserPreferences(dbUser.id, updates);
    const prefs = await getUserPreferences(dbUser.id);
    return NextResponse.json(prefs);
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    console.error('[Preferences PATCH]', e);
    return NextResponse.json({ error: 'Error al guardar preferencias' }, { status: 500 });
  }
}
