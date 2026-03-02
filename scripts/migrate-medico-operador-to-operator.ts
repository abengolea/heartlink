/**
 * Migración: medico_operador → operator
 *
 * Actualiza todos los usuarios en Firestore que tengan role === 'medico_operador'
 * a role === 'operator'. Ejecutar una sola vez.
 *
 * Uso:
 *   npx tsx scripts/migrate-medico-operador-to-operator.ts
 *
 * Requiere: FIREBASE_SERVICE_ACCOUNT_KEY o SERVICE_ACCOUNT_KEY en .env
 * (o credentials de ADC si estás en un entorno Google Cloud)
 */

import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'heartlink-f4ftq';

async function main() {
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
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('role', '==', 'medico_operador').get();

  if (snapshot.empty) {
    console.log('✅ No hay usuarios con role medico_operador. Nada que migrar.');
    return;
  }

  console.log(`📋 Encontrados ${snapshot.size} usuario(s) con medico_operador`);
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { role: 'operator' });
    console.log(`  - ${doc.id} (${doc.data().name || doc.data().email}) → operator`);
  });

  await batch.commit();
  console.log(`✅ Migración completada: ${snapshot.size} usuario(s) actualizados a operator`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
