import { getFirestoreAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';

export interface AdminPricingConfig {
  monthlyPrice: number;
  annualPrice: number;
  annualDiscountPercent: number;
  currency: string;
  isActive: boolean;
  gracePeriodDays: number;
}

const DEFAULT_CONFIG: AdminPricingConfig = {
  monthlyPrice: 20000,
  annualPrice: 144000,
  annualDiscountPercent: 40,
  currency: 'ARS',
  isActive: true,
  gracePeriodDays: 15,
};

export async function getAdminPricingConfig(): Promise<AdminPricingConfig> {
  try {
    const db = getFirestore(getFirestoreAdmin());
    const doc = await db.collection('admin').doc('pricing').get();
    if (!doc.exists) return DEFAULT_CONFIG;
    const data = doc.data() as Partial<AdminPricingConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...data,
      gracePeriodDays: data.gracePeriodDays ?? 15,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
