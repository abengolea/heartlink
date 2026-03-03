'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase-client';
import { User as DBUser } from '@/lib/types';
import { AuthContext } from '@/contexts/auth-context';

/**
 * Inner AuthProvider that uses Firebase. Cargado solo en el cliente vía dynamic import
 * para evitar que firebase-client se inicialice durante el build/SSR (evita auth/invalid-api-key).
 */
export function AuthProviderWithFirebase({ children }: { children: React.ReactNode }) {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [dbUserLoading, setDbUserLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser?.email) {
        setDbUserLoading(true);
        try {
          console.log('🔍 [Auth] Fetching user data for:', firebaseUser.email);

          const token = await firebaseUser.getIdToken();
          const response = await fetch(
            `/api/users/by-email?email=${encodeURIComponent(firebaseUser.email)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.ok) {
            const userData = await response.json();
            setDbUser(userData.user);
            console.log('✅ [Auth] User data loaded:', userData.user);
          } else {
            console.log('❌ [Auth] User not found in database:', firebaseUser.email);
            setDbUser(null);
          }
        } catch (err) {
          console.error('❌ [Auth] Error fetching user data:', err);
          setDbUser(null);
        } finally {
          setDbUserLoading(false);
        }
      } else {
        setDbUser(null);
      }
    };

    fetchUserData();
  }, [firebaseUser]);

  const signOut = async () => {
    try {
      await auth.signOut();
      setDbUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const value = {
    firebaseUser,
    dbUser,
    loading: loading || dbUserLoading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
