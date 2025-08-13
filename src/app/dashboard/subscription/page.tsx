'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, AlertTriangle, CreditCard, Calendar, User, RefreshCw } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface SubscriptionStatus {
  hasSubscription: boolean;
  hasAccess: boolean;
  subscription: {
    id: string;
    status: string;
    planType: string;
    amount: number;
    currency: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    lastPaymentDate?: string;
    isAccessBlocked: boolean;
    daysRemaining: number;
    paymentHistory: Array<{
      id: string;
      amount: number;
      status: string;
      paymentDate: string;
      description: string;
      paymentMethod?: string;
    }>;
  } | null;
  accessInfo: {
    reason: string;
    message: string;
    color: string;
  };
}

function SubscriptionPageContent() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const searchParams = useSearchParams();

  // Mock user ID - En una app real, esto vendría de la autenticación
  const mockUserId = "user123";

  const fetchSubscriptionStatus = async () => {
    try {
      console.log('📊 [Subscription Page] Fetching status...');
      const response = await fetch(`/api/subscription/status?userId=${mockUserId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionStatus(data);
        console.log('📊 [Subscription Page] Status loaded:', data);
      } else {
        console.error('❌ [Subscription Page] Failed to fetch status:', data);
        toast.error('Error al cargar el estado de la suscripción');
      }
    } catch (error) {
      console.error('❌ [Subscription Page] Error:', error);
      toast.error('Error al cargar el estado de la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessingPayment(true);
    
    try {
      console.log('💳 [Subscription Page] Creating subscription...');
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: mockUserId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('💳 [Subscription Page] Subscription created:', data);
        toast.success('Redirigiendo a MercadoPago...');
        
        // Redirigir a MercadoPago
        window.location.href = data.checkoutUrl;
      } else {
        console.error('❌ [Subscription Page] Failed to create subscription:', data);
        toast.error('Error al crear la suscripción');
      }
    } catch (error) {
      console.error('❌ [Subscription Page] Error:', error);
      toast.error('Error al procesar la suscripción');
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Manejar parámetros de URL (callbacks de MercadoPago)
    const status = searchParams.get('status');
    if (status) {
      switch (status) {
        case 'success':
          toast.success('¡Pago exitoso! Tu suscripción ha sido activada.');
          break;
        case 'failure':
          toast.error('El pago falló. Por favor, intenta de nuevo.');
          break;
        case 'pending':
          toast.info('Tu pago está pendiente. Te notificaremos cuando se procese.');
          break;
      }
      
      // Limpiar URL
      window.history.replaceState({}, '', '/dashboard/subscription');
      
      // Recargar estado después de un callback
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestionar Suscripción
          </h1>
          <p className="text-muted-foreground text-sm">
            Cargando información de tu suscripción...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStatusBadge = () => {
    if (!subscriptionStatus?.hasSubscription) {
      return <Badge variant="destructive">Sin Suscripción</Badge>;
    }
    
    const { subscription, hasAccess, accessInfo } = subscriptionStatus;
    
    if (!hasAccess) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    if (accessInfo.reason === 'grace_period') {
      return <Badge variant="secondary">Período de Gracia</Badge>;
    }
    
    if (subscription?.status === 'active') {
      return <Badge variant="default">Activa</Badge>;
    }
    
    return <Badge variant="outline">{subscription?.status || 'Desconocido'}</Badge>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestionar Suscripción
          </h1>
          <p className="text-muted-foreground text-sm">
            Administra tu plan de suscripción para acceder a todas las funcionalidades.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSubscriptionStatus}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estado Actual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tu Plan Actual</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            {subscriptionStatus?.accessInfo.message}
          </CardDescription>
        </CardHeader>
        
        {subscriptionStatus?.hasSubscription && subscriptionStatus.subscription && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="text-sm">Mensual</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Monto</p>
                <p className="text-sm">{formatCurrency(subscriptionStatus.subscription.amount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Próximo Pago</p>
                <p className="text-sm">{formatDate(subscriptionStatus.subscription.nextBillingDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Días Restantes</p>
                <p className="text-sm">
                  {subscriptionStatus.subscription.daysRemaining > 0 
                    ? `${subscriptionStatus.subscription.daysRemaining} días`
                    : 'Vencido'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Plan de Suscripción */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Operador</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">$5,000</span>
            <span className="text-muted-foreground">/ mes</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Subida de estudios ilimitada</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Acceso vía WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Generación de links públicos</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Soporte prioritario</span>
          </div>
        </CardContent>
        <CardFooter>
          {subscriptionStatus?.hasAccess ? (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSubscribe}
              disabled={processingPayment}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${processingPayment ? 'animate-spin' : ''}`} />
              {processingPayment ? 'Procesando...' : 'Renovar Suscripción'}
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={processingPayment}
            >
              <CreditCard className={`h-4 w-4 mr-2 ${processingPayment ? 'animate-spin' : ''}`} />
              {processingPayment ? 'Procesando...' : 'Suscribirse Ahora'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Historial de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Aquí puedes ver tus pagos anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionStatus?.subscription?.paymentHistory?.length ? (
            <div className="space-y-3">
              {subscriptionStatus.subscription.paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paymentDate)} • {payment.paymentMethod || 'MercadoPago'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                    <Badge 
                      variant={payment.status === 'approved' ? 'default' : 
                               payment.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {payment.status === 'approved' ? 'Aprobado' :
                       payment.status === 'pending' ? 'Pendiente' :
                       payment.status === 'rejected' ? 'Rechazado' : payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
          )}
        </CardContent>
      </Card>

      {/* Advertencias */}
      {subscriptionStatus?.accessInfo.reason === 'grace_period' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Período de Gracia</p>
                <p className="text-sm text-orange-700">
                  Tu suscripción ha vencido, pero aún puedes usar la plataforma por algunos días. 
                  Te recomendamos renovar pronto para evitar interrupciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
