'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { User as DBUser } from '@/lib/types';

interface AuthContextType {
  firebaseUser: User | null;
  dbUser: DBUser | null;
  loading: boolean;
  error: Error | undefined;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAuthValue: AuthContextType = {
  firebaseUser: null,
  dbUser: null,
  loading: true,
  error: undefined,
  signOut: async () => {},
};

/**
 * AuthProvider que carga Firebase solo tras el mount en el cliente.
 * Evita auth/invalid-api-key durante el build/SSR cuando NEXT_PUBLIC_FIREBASE_API_KEY
 * no está disponible en el entorno de compilación.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [Inner, setInner] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    import('./auth-provider-with-firebase').then((m) => setInner(() => m.AuthProviderWithFirebase));
  }, []);

  if (!Inner) {
    return (
      <AuthContext.Provider value={defaultAuthValue}>{children}</AuthContext.Provider>
    );
  }

  return <Inner>{children}</Inner>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}