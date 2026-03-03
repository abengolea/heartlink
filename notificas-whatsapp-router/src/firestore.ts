/**
 * Persistencia Firestore para WhatsApp Router
 */

import { getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  UserMembership,
  WaSession,
  WaPendingChoice,
  WaLastTenant,
  PendingChoiceOption,
  Tenant,
} from './types.js';

function getDb() {
  const admin = await import('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return getFirestore();
}

const SANITIZE_REGEX = /[^0-9a-zA-Z]/g;

function sanitizePhoneForDocId(phone: string): string {
  return phone.replace(SANITIZE_REGEX, '_');
}

const MS_24H = 24 * 60 * 60 * 1000;
const MS_30D = 30 * 24 * 60 * 60 * 1000;

export async function getMemberships(phone: string): Promise<UserMembership | null> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  const doc = await db.collection('user_memberships').doc(docId).get();
  if (!doc.exists) return null;
  const d = doc.data() as { phone?: string; tenantIds: string[]; updatedAt: Timestamp };
  return {
    phone: d.phone ?? phone,
    tenantIds: d.tenantIds ?? [],
    updatedAt: d.updatedAt?.toDate() ?? new Date(),
  };
}

export async function getTenants(tenantIds: string[]): Promise<Tenant[]> {
  if (tenantIds.length === 0) return [];
  const db = await getDb();
  const results: Tenant[] = [];
  for (const id of tenantIds) {
    const doc = await db.collection('tenants').doc(id).get();
    if (doc.exists) {
      const d = doc.data() as { name: string; status: string; referralTokens?: string[] };
      results.push({
        id: doc.id,
        name: d.name ?? '',
        status: (d.status as 'active' | 'inactive') ?? 'active',
        referralTokens: d.referralTokens,
      });
    }
  }
  return results;
}

export async function getSession(sessionKey: string): Promise<WaSession | null> {
  const db = await getDb();
  const doc = await db.collection('wa_sessions').doc(sessionKey).get();
  if (!doc.exists) return null;
  const d = doc.data() as Record<string, unknown>;
  const expiresAt = d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : new Date(0);
  if (expiresAt.getTime() < Date.now()) return null;
  return {
    phone: String(d.phone),
    conversationId: d.conversationId as string | undefined,
    activeTenantId: String(d.activeTenantId),
    state: String(d.state),
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(),
    expiresAt,
  };
}

export async function setSession(
  sessionKey: string,
  data: { phone: string; conversationId?: string; activeTenantId: string; state?: string }
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MS_24H);
  await db.collection('wa_sessions').doc(sessionKey).set(
    {
      ...data,
      state: data.state ?? 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    },
    { merge: true }
  );
}

export async function getPendingChoice(phone: string): Promise<WaPendingChoice | null> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  const doc = await db.collection('wa_pending_choices').doc(docId).get();
  if (!doc.exists) return null;
  const d = doc.data() as Record<string, unknown>;
  const expiresAt = d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : new Date(0);
  if (expiresAt.getTime() < Date.now()) return null;
  const options = (d.options as PendingChoiceOption[]) ?? [];
  return {
    phone,
    options,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    expiresAt,
    attempts: Number(d.attempts) || 0,
  };
}

export async function setPendingChoice(
  phone: string,
  options: PendingChoiceOption[]
): Promise<void> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MS_24H);
  await db.collection('wa_pending_choices').doc(docId).set({
    phone,
    options,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    attempts: 0,
  });
}

export async function incrementPendingChoiceAttempts(phone: string): Promise<number> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  const doc = await db.collection('wa_pending_choices').doc(docId).get();
  if (!doc.exists) return 0;
  const current = (doc.data() as { attempts?: number })?.attempts ?? 0;
  const next = current + 1;
  await db.collection('wa_pending_choices').doc(docId).update({
    attempts: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return next;
}

export async function deletePendingChoice(phone: string): Promise<void> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  await db.collection('wa_pending_choices').doc(docId).delete();
}

export async function getLastTenant(phone: string): Promise<WaLastTenant | null> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  const doc = await db.collection('wa_last_tenant').doc(docId).get();
  if (!doc.exists) return null;
  const d = doc.data() as { tenantId: string; updatedAt: Timestamp };
  const updatedAt = d.updatedAt?.toDate() ?? new Date(0);
  if (Date.now() - updatedAt.getTime() > MS_30D) return null;
  return {
    phone,
    tenantId: d.tenantId,
    updatedAt,
  };
}

export async function setLastTenant(phone: string, tenantId: string): Promise<void> {
  const db = await getDb();
  const docId = sanitizePhoneForDocId(phone);
  await db.collection('wa_last_tenant').doc(docId).set({
    phone,
    tenantId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function logMessage(data: {
  messageId: string;
  direction: 'in' | 'out';
  phone: string;
  tenantId?: string;
  payload: unknown;
  pricingCategory?: string;
}): Promise<void> {
  const db = await getDb();
  await db.collection('wa_messages').doc(data.messageId).set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function messageExists(messageId: string): Promise<boolean> {
  const db = await getDb();
  const doc = await db.collection('wa_messages').doc(messageId).get();
  return doc.exists;
}

/** Bucket de 24h para sessionKey cuando no hay conversationId */
export function getDateBucket(timestampMs: number): string {
  const d = new Date(timestampMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
