'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase-client';
import { User as DBUser } from '@/lib/types';
import { AuthContext, type SessionUser } from '@/contexts/auth-context';

/**
 * Inner AuthProvider that uses Firebase. Cargado solo en el cliente vía dynamic import
 * para evitar que firebase-client se inicialice durante el build/SSR (evita auth/invalid-api-key).
 */
export function AuthProviderWithFirebase({ children }: { children: React.ReactNode }) {
  const [firebaseUser, loadingFirebase, error] = useAuthState(auth);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [dbUserLoading, setDbUserLoading] = useState(false);

  const refreshSessionCookie = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (r.ok) {
        const d = await r.json();
        if (d.user?.uid && d.user?.email) {
          setSessionUser({ uid: d.user.uid, email: d.user.email });
          return;
        }
      }
      setSessionUser(null);
    } catch {
      setSessionUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshSessionCookie();
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSessionCookie]);

  useEffect(() => {
    const onSession = () => void refreshSessionCookie();
    window.addEventListener('heartlink-auth-session', onSession);
    return () => window.removeEventListener('heartlink-auth-session', onSession);
  }, [refreshSessionCookie]);

  const emailForProfile = firebaseUser?.email ?? sessionUser?.email ?? null;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!emailForProfile) {
        setDbUser(null);
        return;
      }
      setDbUserLoading(true);
      try {
        console.log('🔍 [Auth] Fetching user data for:', emailForProfile);

        let response: Response;
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          response = await fetch(
            `/api/users/by-email?email=${encodeURIComponent(emailForProfile)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          response = await fetch(
            `/api/users/by-email?email=${encodeURIComponent(emailForProfile)}`,
            { credentials: 'same-origin' }
          );
        }

        if (response.ok) {
          const userData = await response.json();
          setDbUser(userData.user);
          console.log('✅ [Auth] User data loaded:', userData.user);
        } else {
          console.log('❌ [Auth] User not found in database:', emailForProfile);
          setDbUser(null);
        }
      } catch (err) {
        console.error('❌ [Auth] Error fetching user data:', err);
        setDbUser(null);
      } finally {
        setDbUserLoading(false);
      }
    };

    void fetchUserData();
  }, [firebaseUser, sessionUser, emailForProfile]);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
      console.error('Logout cookie error:', e);
    }
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setSessionUser(null);
    setDbUser(null);
  };

  const loading = !sessionChecked || loadingFirebase || dbUserLoading;

  const value = {
    firebaseUser: firebaseUser ?? null,
    sessionUser,
    dbUser,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
