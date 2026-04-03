'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type AccessBannerCopy = { title: string; description: string };

function copyForReason(
  reason: string | undefined,
  apiMessage: string | undefined
): AccessBannerCopy {
  const fallbackBody =
    'Solo puedes ver lo enviado y tus archivos. Para subir estudios, enviar por WhatsApp o cargar contenido nuevo, actualiza tu suscripción.';

  switch (reason) {
    case 'access_blocked':
      return {
        title: 'Acceso bloqueado',
        description:
          apiMessage ||
          'Tu acceso fue restringido. Si ya pagaste o reactivaste tu plan y sigue igual, usá «Actualizar» en la pantalla de suscripción o contactá soporte.',
      };
    case 'subscription_inactive':
      return {
        title: 'Suscripción inactiva',
        description: apiMessage || fallbackBody,
      };
    case 'expired':
      return {
        title: 'Suscripción vencida',
        description: apiMessage || fallbackBody,
      };
    case 'no_subscription':
      return {
        title: 'Sin suscripción activa',
        description: apiMessage || fallbackBody,
      };
    default:
      return {
        title: 'Sin acceso completo',
        description: apiMessage || fallbackBody,
      };
  }
}

export function SubscriptionBanner() {
  const { dbUser } = useAuth();
  const [banner, setBanner] = useState<AccessBannerCopy | null>(null);

  useEffect(() => {
    if (!dbUser?.id) {
      setBanner(null);
      return;
    }
    if (dbUser.role === 'admin') {
      setBanner(null);
      return;
    }
    fetchWithAuth(`/api/subscription/status?userId=${encodeURIComponent(dbUser.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasAccess) {
          setBanner(null);
          return;
        }
        const reason = data.accessInfo?.reason as string | undefined;
        setBanner(copyForReason(reason, data.accessInfo?.message ?? data.statusMessage));
      })
      .catch(() => setBanner(null));
  }, [dbUser?.id, dbUser?.role]);

  if (!banner) return null;

  return (
    <Alert
      variant="destructive"
      className="rounded-none border-x-0 border-t-0 border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive [&>svg]:text-destructive"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-0.5">
          <AlertTitle className="text-destructive">{banner.title}</AlertTitle>
          <AlertDescription className="text-destructive/90">{banner.description}</AlertDescription>
        </div>
        <Button variant="destructive" size="sm" className="shrink-0 gap-2" asChild>
          <Link href="/dashboard/subscription">
            <CreditCard className="h-4 w-4" />
            Pagar suscripción
          </Link>
        </Button>
      </div>
    </Alert>
  );
}
