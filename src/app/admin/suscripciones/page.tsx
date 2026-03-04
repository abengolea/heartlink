'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, RefreshCw, Shield, Unlock, Lock, Calendar, User } from "lucide-react";
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface PricingConfig {
  monthlyPrice: number;
  annualPrice: number;
  annualDiscountPercent: number;
  gracePeriodDays: number;
  currency: string;
}

interface Subscription {
  id: string;
  userId: string;
  status: string;
  planType: string;
  amount: number;
  endDate: string;
  gracePeriodEndDate?: string;
  isAccessBlocked: boolean;
  startDate: string;
}

export default function AdminSuscripcionesPage() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [actionSubId, setActionSubId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'unblock' | 'block' | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pricingRes, subsRes, usersRes] = await Promise.all([
        fetchWithAuth('/api/admin/pricing'),
        fetchWithAuth('/api/admin/subscriptions'),
        fetchWithAuth('/api/users'),
      ]);

      if (pricingRes.ok) {
        const p = await pricingRes.json();
        setPricing({ ...p, gracePeriodDays: p.gracePeriodDays ?? 15 });
      }
      if (subsRes.ok) {
        const subs = await subsRes.json();
        setSubscriptions(subs);
      }
      if (usersRes.ok) {
        const us = await usersRes.json();
        const map: Record<string, { name: string; email: string }> = {};
        us.forEach((u: { id: string; name?: string; email?: string }) => {
          map[u.id] = { name: u.name || 'Sin nombre', email: u.email || '' };
        });
        setUsers(map);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async () => {
    if (!actionSubId || !actionType) return;
    try {
      const res = await fetchWithAuth(`/api/admin/subscriptions/${actionSubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAccessBlocked: actionType === 'block',
          status: actionType === 'block' ? 'suspended' : 'active',
        }),
      });
      if (res.ok) {
        toast.success(actionType === 'unblock' ? 'Acceso restaurado' : 'Acceso bloqueado');
        setActionSubId(null);
        setActionType(null);
        loadData();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Error');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al ejecutar acción');
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const getStatusBadge = (sub: Subscription) => {
    if (sub.isAccessBlocked) return <Badge variant="destructive">Bloqueado</Badge>;
    if (sub.status === 'active') return <Badge variant="default">Activa</Badge>;
    if (sub.status === 'suspended') return <Badge variant="secondary">Suspendida</Badge>;
    if (sub.status === 'inactive') return <Badge variant="outline">Inactiva</Badge>;
    return <Badge variant="outline">{sub.status}</Badge>;
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const inGracePeriod = (sub: Subscription) => {
    if (!sub.gracePeriodEndDate) return false;
    const now = new Date();
    const end = new Date(sub.endDate);
    const grace = new Date(sub.gracePeriodEndDate);
    return now > end && now <= grace;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Suscripciones
        </h1>
        <p className="text-muted-foreground text-sm">
          Gestiona precios, días de gracia y estado de suscripciones. A los 15 días (configurable) de atraso, el usuario queda inactivo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Valores y reglas de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pricing ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mensual:</span>
                    <p className="font-medium">{formatCurrency(pricing.monthlyPrice)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Anual:</span>
                    <p className="font-medium">{formatCurrency(pricing.annualPrice)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Descuento anual:</span>
                    <p className="font-medium">{pricing.annualDiscountPercent}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Días de gracia:</span>
                    <p className="font-medium">{pricing.gracePeriodDays} días</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/pricing">Editar en Facturación</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Cargando...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              Estados de suscripciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-medium">{subscriptions.length}</span> suscripciones
                </p>
                <p>
                  <span className="text-muted-foreground">Activas:</span>{' '}
                  <span className="font-medium text-green-600">
                    {subscriptions.filter(s => s.status === 'active' && !s.isAccessBlocked).length}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Bloqueadas:</span>{' '}
                  <span className="font-medium text-red-600">
                    {subscriptions.filter(s => s.isAccessBlocked).length}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Listado de suscripciones</CardTitle>
            <CardDescription>
              Puedes desbloquear o bloquear acceso manualmente
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-muted-foreground">No hay suscripciones</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const u = users[sub.userId];
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u?.name || sub.userId}</p>
                            {u?.email && (
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.planType === 'annual' ? 'Anual' : 'Mensual'}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(sub.amount)}</TableCell>
                        <TableCell>
                          <span className={isExpired(sub.endDate) ? 'text-red-600' : ''}>
                            {format(parseISO(sub.endDate), 'd MMM y', { locale: es })}
                          </span>
                          {inGracePeriod(sub) && (
                            <p className="text-xs text-amber-600">En período de gracia</p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub)}</TableCell>
                        <TableCell>
                          {sub.isAccessBlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActionSubId(sub.id);
                                setActionType('unblock');
                              }}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Desbloquear
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => {
                                setActionSubId(sub.id);
                                setActionType('block');
                              }}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Bloquear
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!actionSubId} onOpenChange={(o) => !o && (setActionSubId(null), setActionType(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'unblock' ? 'Desbloquear acceso' : 'Bloquear acceso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'unblock'
                ? 'El usuario podrá usar la app con normalidad.'
                : 'El usuario solo podrá ver lo enviado y sus archivos. No podrá subir estudios ni enviar por WhatsApp.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
