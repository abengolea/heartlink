'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

export function useSubscriptionStatus() {
  const { dbUser } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUser?.id) {
      setHasAccess(null);
      setLoading(false);
      return;
    }
    if (dbUser.role === 'admin') {
      setHasAccess(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWithAuth(`/api/subscription/status?userId=${encodeURIComponent(dbUser.id)}`)
      .then((res) => res.json())
      .then((data) => {
        setHasAccess(data.hasAccess ?? false);
      })
      .catch(() => setHasAccess(null))
      .finally(() => setLoading(false));
  }, [dbUser?.id, dbUser?.role]);

  return { hasAccess, loading };
}
