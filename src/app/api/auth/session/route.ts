import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';

/** Estado de sesión (cookie httpOnly o Bearer) para hidratar el cliente sin SDK Auth. */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({
    user: { uid: user.firebaseUid, email: user.email },
  });
}
