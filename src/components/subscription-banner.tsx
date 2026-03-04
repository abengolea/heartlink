'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { AlertTriangle, CreditCard } from 'lucide-react';

export function SubscriptionBanner() {
  const { dbUser } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!dbUser?.id) {
      setHasAccess(null);
      return;
    }
    if (dbUser.role === 'admin') {
      setHasAccess(true);
      return;
    }
    fetchWithAuth(`/api/subscription/status?userId=${encodeURIComponent(dbUser.id)}`)
      .then((res) => res.json())
      .then((data) => setHasAccess(data.hasAccess ?? false))
      .catch(() => setHasAccess(null));
  }, [dbUser?.id, dbUser?.role]);

  if (hasAccess !== false) return null;

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              Acceso bloqueado por falta de pago
            </p>
            <p className="text-sm text-red-700">
              Solo puedes ver lo enviado y tus archivos. Para subir estudios, enviar por WhatsApp o cargar contenido nuevo, actualiza tu suscripción.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm shrink-0"
        >
          <CreditCard className="h-4 w-4" />
          Pagar Suscripción
        </Link>
      </div>
    </div>
  );
}
