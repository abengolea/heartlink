'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, DollarSign, Percent, Save, RefreshCw, CreditCard } from "lucide-react";
import { toast } from 'sonner';

interface PricingConfig {
  monthlyPrice: number;
  annualPrice: number;
  annualDiscountPercent: number;
  currency: string;
  isActive: boolean;
  gracePeriodDays: number;
}

export default function AdminPricingPage() {
  const { dbUser } = useAuth();
  const [paymentTestLoading, setPaymentTestLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig>({
    monthlyPrice: 20000,
    annualPrice: 144000,
    annualDiscountPercent: 40,
    currency: 'ARS',
    isActive: true,
    gracePeriodDays: 15,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const calculateAnnualPrice = (monthlyPrice: number, discountPercent: number) => {
    const yearlyPrice = monthlyPrice * 12;
    const discount = yearlyPrice * (discountPercent / 100);
    return yearlyPrice - discount;
  };

  const handleMonthlyPriceChange = (value: string) => {
    const monthlyPrice = parseFloat(value) || 0;
    const annualPrice = calculateAnnualPrice(monthlyPrice, pricing.annualDiscountPercent);
    
    setPricing(prev => ({
      ...prev,
      monthlyPrice,
      annualPrice
    }));
  };

  const handleDiscountChange = (value: string) => {
    const discountPercent = parseFloat(value) || 0;
    const annualPrice = calculateAnnualPrice(pricing.monthlyPrice, discountPercent);
    
    setPricing(prev => ({
      ...prev,
      annualDiscountPercent: discountPercent,
      annualPrice
    }));
  };

  const loadPricingConfig = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing({ ...data, gracePeriodDays: data.gracePeriodDays ?? 15 });
        toast.success('Configuración cargada');
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const savePricingConfig = async () => {
    setSaving(true);
    try {
      const response = await fetchWithAuth('/api/admin/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricing),
      });
      
      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handlePaymentTestMercadoPago = async (simulate: boolean) => {
    if (!dbUser?.id || paymentTestLoading) return;
    setPaymentTestLoading(true);
    try {
      const res = await fetchWithAuth('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUser.id, planType: 'monthly', simulate }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.simulated) {
          toast.success('¡Pago simulado exitoso!');
        } else if (data.checkoutUrl) {
          toast.success('Redirigiendo a MercadoPago...');
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(data.error || 'Error al crear suscripción');
        }
      } else {
        throw new Error(data.error || 'Error al crear suscripción');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear suscripción');
    } finally {
      setPaymentTestLoading(false);
    }
  };

  const handlePaymentTestDLocal = async () => {
    if (!dbUser?.id || paymentTestLoading) return;
    setPaymentTestLoading(true);
    try {
      const res = await fetchWithAuth('/api/dlocal/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUser.id, planType: 'monthly' }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        toast.success('Redirigiendo a DLocal...');
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Error al crear pago DLocal');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear pago DLocal');
    } finally {
      setPaymentTestLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración de Precios
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los precios de las suscripciones mensuales y anuales (IVA incluido)
          </p>
        </div>
        <Badge variant={pricing.isActive ? "default" : "secondary"}>
          {pricing.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {/* Pruebas de pago - visible para admin */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pruebas de pago
          </CardTitle>
          <CardDescription>
            Probar el flujo de suscripción con MercadoPago, simulación o DLocal. Usa tu propia cuenta como usuario de prueba.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="default"
              className="border-green-400 text-green-800 hover:bg-green-50 dark:text-green-200 dark:border-green-600"
              onClick={() => handlePaymentTestMercadoPago(false)}
              disabled={paymentTestLoading || !dbUser?.id}
            >
              {paymentTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pago real (MercadoPago)
            </Button>
            <Button
              variant="outline"
              size="default"
              className="text-amber-800 border-amber-400 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-600"
              onClick={() => handlePaymentTestMercadoPago(true)}
              disabled={paymentTestLoading || !dbUser?.id}
            >
              {paymentTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Simular pago (si MP falla)
            </Button>
            <Button
              variant="outline"
              size="default"
              className="border-violet-400 text-violet-800 hover:bg-violet-50 dark:text-violet-200 dark:border-violet-600"
              onClick={handlePaymentTestDLocal}
              disabled={paymentTestLoading || !dbUser?.id}
            >
              {paymentTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pagar con DLocal
            </Button>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Si &quot;Pago real&quot; da error PA_UNAUTHORIZED, usá &quot;Simular pago&quot;. Revisá credenciales en developers.mercadopago.com
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración de Precios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración de Precios
            </CardTitle>
            <CardDescription>
              Ajusta los precios mensuales y anuales de las suscripciones. Todos los precios son IVA incluido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Precio Mensual (ARS, IVA incluido)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={pricing.monthlyPrice}
                onChange={(e) => handleMonthlyPriceChange(e.target.value)}
                placeholder="20000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Descuento Anual (%)</Label>
              <Input
                id="discount"
                type="number"
                value={pricing.annualDiscountPercent}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="40"
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gracePeriodDays">Días de gracia (tras vencimiento)</Label>
              <Input
                id="gracePeriodDays"
                type="number"
                value={pricing.gracePeriodDays}
                onChange={(e) => setPricing(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 15 }))}
                placeholder="15"
                min="1"
                max="90"
              />
              <p className="text-xs text-muted-foreground">
                Tras vencer la mensualidad, el usuario tiene estos días para pagar antes de quedar inactivo.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Precio Anual (Calculado)</Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Precio base anual: {formatCurrency(pricing.monthlyPrice * 12)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Descuento ({pricing.annualDiscountPercent}%): -{formatCurrency((pricing.monthlyPrice * 12) * (pricing.annualDiscountPercent / 100))}
                </div>
                <div className="text-lg font-semibold">
                  Precio final: {formatCurrency(pricing.annualPrice)}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              onClick={loadPricingConfig}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
            <Button
              onClick={savePricingConfig}
              disabled={saving}
              className="flex-1"
            >
              <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardFooter>
        </Card>

        {/* Vista Previa */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Planes</CardTitle>
            <CardDescription>
              Así verán los usuarios los planes de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Mensual */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Plan Mensual</h3>
                <Badge variant="outline">Mensual</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold">{formatCurrency(pricing.monthlyPrice)}</span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Facturación mensual, cancela cuando quieras. IVA incluido.
              </p>
            </div>

            {/* Plan Anual */}
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Plan Anual</h3>
                <Badge className="bg-green-600">
                  {pricing.annualDiscountPercent}% Descuento
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold">{formatCurrency(pricing.annualPrice)}</span>
                <span className="text-muted-foreground">/ año</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                <span className="line-through">{formatCurrency(pricing.monthlyPrice * 12)}</span>
                <span className="ml-2 font-semibold text-green-600">
                  Ahorras {formatCurrency((pricing.monthlyPrice * 12) - pricing.annualPrice)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pago único anual con descuento significativo. IVA incluido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Cálculos y Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(pricing.monthlyPrice)}</div>
              <div className="text-sm text-muted-foreground">Precio Mensual (IVA incl.)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(pricing.annualPrice)}</div>
              <div className="text-sm text-muted-foreground">Precio Anual (IVA incl.)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{pricing.annualDiscountPercent}%</div>
              <div className="text-sm text-muted-foreground">Descuento Anual</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}