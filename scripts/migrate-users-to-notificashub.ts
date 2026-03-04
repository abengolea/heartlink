/**
 * Migración: Registrar en NotificasHub todos los usuarios de HeartLink que tengan phone.
 *
 * Lee la colección users de Firestore (HeartLink), y por cada usuario con phone
 * llama POST {NOTIFICASHUB_URL}/api/register-user para que el router multi-tenant
 * pueda enrutar sus mensajes de WhatsApp a HeartLink.
 *
 * Uso:
 *   npx tsx scripts/migrate-users-to-notificashub.ts
 *
 * Requiere en .env:
 *   FIREBASE_SERVICE_ACCOUNT_KEY (o SERVICE_ACCOUNT_KEY) - credenciales HeartLink
 *   NOTIFICASHUB_URL - ej: https://notificashub--studio-3864746689-59018.us-east4.hosted.app
 *   INTERNAL_SECRET - secreto compartido con NotificasHub
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Cargar .env y .env.local (el proyecto usa .env.local para credenciales)
config({ path: resolve(process.cwd(), '.env') });
if (existsSync(resolve(process.cwd(), '.env.local'))) {
  config({ path: resolve(process.cwd(), '.env.local'), override: false });
}

const PROJECT_ID = 'heartlink-f4ftq';

function normalizePhone(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits || digits.length < 10) return '';
  if (digits.startsWith('54')) return digits;
  return '54' + digits;
}

async function main() {
  const notificasUrl = process.env.NOTIFICASHUB_URL?.trim();
  const internalSecret = process.env.INTERNAL_SECRET?.trim();

  if (!notificasUrl || !internalSecret) {
    console.error('❌ Faltan NOTIFICASHUB_URL e INTERNAL_SECRET en .env');
    process.exit(1);
  }

  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.SERVICE_ACCOUNT_KEY;
    if (!key) {
      console.error('❌ Faltan FIREBASE_SERVICE_ACCOUNT_KEY o SERVICE_ACCOUNT_KEY en .env');
      process.exit(1);
    }
    try {
      const serviceAccount = JSON.parse(key);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: PROJECT_ID,
      });
    } catch (e) {
      console.error('❌ Error al parsear credenciales:', e);
      process.exit(1);
    }
  }

  const db = getFirestore();
  const usersSnapshot = await db.collection('users').get();

  const usersWithPhone = usersSnapshot.docs.filter((doc) => {
    const phone = doc.data()?.phone;
    return phone && String(phone).trim() && normalizePhone(String(phone));
  });

  console.log(`📋 Encontrados ${usersWithPhone.length} usuario(s) con teléfono de ${usersSnapshot.size} total`);

  const endpoint = `${notificasUrl.replace(/\/$/, '')}/api/register-user`;
  let ok = 0;
  let fail = 0;

  for (const doc of usersWithPhone) {
    const data = doc.data();
    const rawPhone = String(data.phone ?? '').trim();
    const normalized = normalizePhone(rawPhone);
    if (!normalized) continue;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': internalSecret,
        },
        body: JSON.stringify({ phone: normalized, tenantId: 'heartlink' }),
      });

      if (res.ok) {
        console.log(`  ✅ ${doc.id} (${data.name || 'sin nombre'}) - ${normalized}`);
        ok++;
      } else {
        const text = await res.text();
        console.error(`  ❌ ${doc.id} ${normalized}: ${res.status} ${text}`);
        fail++;
      }
    } catch (err) {
      console.error(`  ❌ ${doc.id} ${normalized}:`, err instanceof Error ? err.message : err);
      fail++;
    }

    // Pequeña pausa para no saturar
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n✅ Migración completada: ${ok} registrados, ${fail} fallos`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
