import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';

interface PricingConfig {
  monthlyPrice: number;
  annualPrice: number;
  annualDiscountPercent: number;
  currency: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string;
}

// Initialize Firestore
function getDb() {
  const app = getFirestoreAdmin();
  return getFirestore(app);
}

// GET - Obtener configuración de precios
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [Admin Pricing API] Getting pricing configuration...');
    
    const db = getDb();
    const pricingDoc = await db.collection('admin').doc('pricing').get();
    
    if (!pricingDoc.exists) {
      // Crear configuración por defecto si no existe
      const defaultPricing: PricingConfig = {
        monthlyPrice: 20000,
        annualPrice: 144000,
        annualDiscountPercent: 40,
        currency: 'ARS',
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
      
      await db.collection('admin').doc('pricing').set(defaultPricing);
      
      console.log('✅ [Admin Pricing API] Created default pricing configuration');
      return NextResponse.json(defaultPricing);
    }
    
    const pricingData = pricingDoc.data() as PricingConfig;
    console.log('✅ [Admin Pricing API] Pricing configuration retrieved');
    
    return NextResponse.json(pricingData);
    
  } catch (error) {
    console.error('❌ [Admin Pricing API] Error getting pricing:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing configuration' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de precios
export async function PUT(request: NextRequest) {
  try {
    console.log('💰 [Admin Pricing API] Updating pricing configuration...');
    
    const body = await request.json();
    
    // Validar datos requeridos
    const { monthlyPrice, annualDiscountPercent } = body;
    
    if (!monthlyPrice || monthlyPrice <= 0) {
      return NextResponse.json(
        { error: 'Monthly price is required and must be positive' },
        { status: 400 }
      );
    }
    
    if (annualDiscountPercent < 0 || annualDiscountPercent > 100) {
      return NextResponse.json(
        { error: 'Annual discount must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Calcular precio anual
    const yearlyPrice = monthlyPrice * 12;
    const discount = yearlyPrice * (annualDiscountPercent / 100);
    const annualPrice = yearlyPrice - discount;
    
    const updatedPricing: PricingConfig = {
      monthlyPrice: Number(monthlyPrice),
      annualPrice: Math.round(annualPrice),
      annualDiscountPercent: Number(annualDiscountPercent),
      currency: body.currency || 'ARS',
      isActive: body.isActive !== undefined ? body.isActive : true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin' // En el futuro, obtener del usuario autenticado
    };
    
    const db = getDb();
    await db.collection('admin').doc('pricing').set(updatedPricing);
    
    console.log('✅ [Admin Pricing API] Pricing configuration updated:', {
      monthlyPrice: updatedPricing.monthlyPrice,
      annualPrice: updatedPricing.annualPrice,
      discount: updatedPricing.annualDiscountPercent
    });
    
    return NextResponse.json({
      success: true,
      pricing: updatedPricing,
      message: 'Pricing configuration updated successfully'
    });
    
  } catch (error) {
    console.error('❌ [Admin Pricing API] Error updating pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing configuration' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva configuración (alias para PUT)
export async function POST(request: NextRequest) {
  return PUT(request);
}