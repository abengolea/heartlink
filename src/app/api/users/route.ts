import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, getDoctorsByOperator } from '@/lib/firestore';
import { getAuthenticatedUser, requireRole } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const role = authUser.dbUser.role;
    if (role === 'medico_solicitante' || role === 'solicitante') {
      return NextResponse.json([authUser.dbUser]);
    }
    if (role === 'operator') {
      const doctors = await getDoctorsByOperator(authUser.dbUser.id);
      const byId = new Map<string, (typeof authUser.dbUser)>();
      byId.set(authUser.dbUser.id, authUser.dbUser);
      for (const d of doctors) {
        byId.set(d.id, d);
      }
      return NextResponse.json([...byId.values()]);
    }
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'operator']);
    const userData = await request.json();
    const role = userData.role || '';
    const needsPhone = ['operator', 'solicitante', 'medico_solicitante'].includes(role);
    if (needsPhone && (!userData.phone || !String(userData.phone).trim())) {
      return NextResponse.json(
        { error: 'El teléfono (WhatsApp) es obligatorio para médicos operadores y solicitantes.' },
        { status: 400 }
      );
    }
    const userId = await createUser(userData);
    return NextResponse.json({ id: userId, success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Solo administradores y operadores pueden crear médicos' }, { status: 403 });
      }
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}