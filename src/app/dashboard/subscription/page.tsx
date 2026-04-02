'use client';

import { useState, useEffect, Suspense } from 'react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, AlertTriangle, CreditCard, Calendar, User, RefreshCw, Download, Ban, Play, Clock, DollarSign, History } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface SubscriptionStatus {
  hasSubscription: boolean;
  hasAccess: boolean;
  subscription: any;
  daysRemaining: number;
  status: string;
  statusMessage: string;
  statusColor: string;
  shouldShowWarning: boolean;
  reason?: string;
  trialSendsRemaining?: number;
}

function SubscriptionPageContent() {
  const searchParams = useSearchParams();
  const { dbUser } = useAuth();
  const router = useRouter();

  // Solo médico operador puede ver esta página. Admin NO.
  useEffect(() => {
    if (dbUser && dbUser.role === 'admin') {
      router.replace('/dashboard');
    }
  }, [dbUser, router]);

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [planType, setPlanType] = useState<'monthly' | 'annual'>('monthly');
  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Usar el ID de Firestore del usuario (las suscripciones se guardan por userId = document id)
  const userId = dbUser?.id || '';

  useEffect(() => {
    if (dbUser?.role === 'admin') return; // Admin es redirigido, no cargar datos
    if (userId) {
      loadSubscriptionStatus();
      loadPricingConfig();
      handlePaymentCallback();
    }
  }, [userId, dbUser?.role]);

  const loadPricingConfig = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/pricing');
      const data = await response.json();
      if (response.ok && data) {
        // GET devuelve el objeto pricing directamente o { success, pricing }
        setPricingConfig(data.pricing || data);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const loadSubscriptionStatus = async () => {
    if (!userId) {
      console.log('⏳ [Subscription] Waiting for user authentication...');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📊 Loading subscription status for user:', userId);
      
      const response = await fetchWithAuth(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      
      console.log('📊 Subscription status:', data);
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('❌ Error loading subscription status:', error);
      toast.error('Error al cargar el estado de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCallback = () => {
    const status = searchParams?.get('status');
    const paymentId = searchParams?.get('payment_id');
    
    if (status === 'success' && paymentId) {
      toast.success('¡Pago procesado exitosamente! Tu suscripción está activa.');
      loadSubscriptionStatus();
    } else if (status === 'failure') {
      toast.error('El pago no pudo ser procesado. Intenta nuevamente.');
    } else if (status === 'pending') {
      toast.warning('Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.');
    }
  };

  const handleSubscribe = async (simulate = false) => {
    setActionLoading(true);
    try {
      console.log('💳 Creating subscription for:', userId, 'plan:', planType, 'simulate:', simulate);
      
      const response = await fetchWithAuth('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planType, simulate }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.simulated) {
          toast.success('¡Pago simulado exitoso!');
        }
        console.log('✅ Subscription created, redirecting:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Error al crear suscripción');
      }
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      toast.error('Error al crear la suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribeDLocal = async () => {
    setActionLoading(true);
    try {
      console.log('💳 Creating DLocal payment for:', userId, 'plan:', planType);
      const response = await fetchWithAuth('/api/dlocal/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planType }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        toast.success('Redirigiendo a DLocal...');
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Error al crear pago DLocal');
      }
    } catch (error) {
      console.error('❌ Error DLocal:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear pago DLocal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
      console.log('🚫 Cancelling subscription for:', userId);
      
      const response = await fetchWithAuth('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: cancelReason || 'user_requested' }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Subscription cancelled:', data);
        toast.success('Suscripción cancelada exitosamente');
        setShowCancelDialog(false);
        loadSubscriptionStatus();
      } else {
        throw new Error(data.error || 'Error al cancelar suscripción');
      }
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading(true);
    try {
      console.log('🔄 Reactivating subscription for:', userId);
      
      const response = await fetchWithAuth('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Subscription reactivated:', data);
        toast.success('Suscripción reactivada exitosamente');
        loadSubscriptionStatus();
      } else {
        throw new Error(data.error || 'Error al reactivar suscripción');
      }
    } catch (error) {
      console.error('❌ Error reactivating subscription:', error);
      toast.error('Error al reactivar la suscripción');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspendida', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
      refunded: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-800' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="flex-1">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestionar Suscripción
          </h1>
          <p className="text-muted-foreground text-sm">
            {subscriptionStatus?.hasSubscription
              ? 'Administra tu suscripción, historial de pagos y configuraciones.'
              : subscriptionStatus?.trialSendsRemaining != null &&
                  subscriptionStatus.trialSendsRemaining > 0
                ? `Tienes ${subscriptionStatus.trialSendsRemaining} envío(s) de prueba gratis al médico por WhatsApp. Podés suscribirte cuando quieras para usar HeartLink sin ese límite.`
                : 'Suscríbete para acceder a todas las funcionalidades de HeartLink.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadSubscriptionStatus} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {!subscriptionStatus?.hasSubscription ? (
        /* Página de Suscripción - Usuario NO suscripto */

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plan Mensual */}
          <Card className={`transition-all ${planType === 'monthly' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan Mensual</CardTitle>
                <Badge variant="outline">Más Popular</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {pricingConfig ? formatCurrency(pricingConfig.monthlyPrice) : '$20,000'}
                </span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              <p className="text-xs text-muted-foreground">IVA incluido</p>
              <CardDescription>
                Pago mensual. Cancela cuando quieras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Subida ilimitada de estudios</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Gestión completa de pacientes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Enlaces públicos para WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Reportes y estadísticas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Soporte técnico incluido</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={() => {
                  setPlanType('monthly');
                  handleSubscribe(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading && planType === 'monthly' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Suscribirse Mensual
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Anual */}
          <Card className={`transition-all ${planType === 'annual' ? 'ring-2 ring-green-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan Anual</CardTitle>
                <Badge className="bg-green-100 text-green-800">
                  {pricingConfig ? `${pricingConfig.annualDiscountPercent}% OFF` : '40% OFF'}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {pricingConfig ? formatCurrency(pricingConfig.annualPrice) : '$144,000'}
                </span>
                <span className="text-muted-foreground">/ año</span>
              </div>
              <p className="text-xs text-muted-foreground">IVA incluido</p>
              <div className="text-sm text-muted-foreground">
                <span className="line-through">
                  {pricingConfig ? formatCurrency(pricingConfig.monthlyPrice * 12) : '$240,000'}
                </span>
                <span className="text-green-600 font-semibold ml-2">
                  Ahorras {pricingConfig ? formatCurrency((pricingConfig.monthlyPrice * 12) - pricingConfig.annualPrice) : '$96,000'}
                </span>
              </div>
              <CardDescription>
                Equivale a {pricingConfig ? formatCurrency(pricingConfig.annualPrice / 12) : '$12,000'}/mes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Todo lo del plan mensual</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-semibold">2 meses gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Soporte prioritario</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Acceso a nuevas funciones</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Sin preocuparte por renovaciones</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => {
                  setPlanType('annual');
                  handleSubscribe(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading && planType === 'annual' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Suscribirse Anual (Mejor oferta)
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        /* Dashboard de Suscripción - Usuario suscripto */
        <div className="grid gap-6">
          {/* Estado Actual */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Estado de Suscripción
                </CardTitle>
                {getStatusBadge(subscriptionStatus.subscription?.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plan Actual</p>
                  <p className="font-semibold capitalize">
                    {subscriptionStatus.subscription?.planType === 'monthly' ? 'Mensual' : 'Anual'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Costo</p>
                  <p className="font-semibold">
                    {formatCurrency(subscriptionStatus.subscription?.amount)}
                    <span className="text-sm text-muted-foreground">
                      /{subscriptionStatus.subscription?.planType === 'monthly' ? 'mes' : 'año'} (IVA incluido)
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Próximo Pago</p>
                  <p className="font-semibold">
                    {subscriptionStatus.subscription?.nextBillingDate 
                      ? formatDate(subscriptionStatus.subscription.nextBillingDate)
                      : 'No programado'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Días Restantes</p>
                  <p className={`font-semibold ${subscriptionStatus.daysRemaining <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {subscriptionStatus.daysRemaining > 0 ? `${subscriptionStatus.daysRemaining} días` : 'Vencido'}
                  </p>
                </div>
              </div>

              {subscriptionStatus.shouldShowWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Atención Requerida</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        {subscriptionStatus.statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!subscriptionStatus.hasAccess && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800">Acceso Bloqueado</h3>
                      <p className="text-red-700 text-sm mt-1">
                        {subscriptionStatus.statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              {subscriptionStatus.subscription?.status === 'cancelled' ? (
                <Button 
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Reactivar Suscripción
                </Button>
              ) : (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      <Ban className="h-4 w-4 mr-2" />
                      Cancelar Suscripción
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>¿Cancelar Suscripción?</DialogTitle>
                      <DialogDescription>
                        Esta acción cancelará tu suscripción inmediatamente. Perderás acceso a subir nuevos estudios.
                        Podrás reactivarla cuando quieras.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Motivo de cancelación (opcional):</label>
                        <Select onValueChange={setCancelReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un motivo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="too_expensive">Muy costoso</SelectItem>
                            <SelectItem value="not_using">No lo estoy usando</SelectItem>
                            <SelectItem value="technical_issues">Problemas técnicos</SelectItem>
                            <SelectItem value="found_alternative">Encontré alternativa</SelectItem>
                            <SelectItem value="temporary_break">Pausa temporal</SelectItem>
                            <SelectItem value="other">Otro motivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Mantener Suscripción
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelSubscription}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4 mr-2" />
                        )}
                        Confirmar Cancelación
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>

          {/* Historial de Pagos */}
          {subscriptionStatus.subscription?.paymentHistory?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription>
                  Últimos pagos y transacciones de tu suscripción
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscriptionStatus.subscription.paymentHistory
                    .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .slice(0, 5)
                    .map((payment: any, index: number) => (
                      <div key={payment.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getPaymentStatusBadge(payment.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {payment.mercadoPagoPaymentId?.slice(-8) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {subscriptionStatus.subscription.paymentHistory.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Ver Historial Completo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información de Facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-medium">
                    {subscriptionStatus.subscription?.startDate 
                      ? formatDate(subscriptionStatus.subscription.startDate)
                      : 'No disponible'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                  <p className="font-medium">
                    {subscriptionStatus.subscription?.endDate 
                      ? formatDate(subscriptionStatus.subscription.endDate)
                      : 'No disponible'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Último Pago</p>
                  <p className="font-medium">
                    {subscriptionStatus.subscription?.lastPaymentDate 
                      ? formatDate(subscriptionStatus.subscription.lastPaymentDate)
                      : 'Ningún pago registrado'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID de Suscripción</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {subscriptionStatus.subscription?.id?.slice(-8) || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestionar Suscripción
          </h1>
          <p className="text-muted-foreground text-sm">
            Cargando...
          </p>
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
