import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserById, updateUser } from "@/lib/firestore";

/**
 * GET /api/users/me - Obtiene el perfil del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const { dbUser } = await requireAuth(request);
    const user = await getUserById(dbUser.id);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[Users/me GET]", e);
    return NextResponse.json({ error: "Error al cargar perfil" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/me - Permite al usuario actualizar su propio perfil (phone, name)
 * Usado por operadores para vincular su WhatsApp y poder subir estudios desde la app
 */
export async function PATCH(request: NextRequest) {
  try {
    const { dbUser } = await requireAuth(request);
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (typeof body.phone === "string") {
      updates.phone = body.phone.trim();
    }
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    await updateUser(dbUser.id, updates);
    const user = await getUserById(dbUser.id);
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[Users/me PATCH]", e);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
