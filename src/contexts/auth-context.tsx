'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase-client';
import { User as DBUser } from '@/lib/types';

interface AuthContextType {
  firebaseUser: User | null;
  dbUser: DBUser | null;
  loading: boolean;
  error: Error | undefined;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [dbUserLoading, setDbUserLoading] = useState(false);

  // Fetch user data from Firestore when Firebase user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser?.email) {
        setDbUserLoading(true);
        try {
          console.log('🔍 [Auth] Fetching user data for:', firebaseUser.email);
          
          const response = await fetch(`/api/users/by-email?email=${encodeURIComponent(firebaseUser.email)}`);
          
          if (response.ok) {
            const userData = await response.json();
            setDbUser(userData.user);
            console.log('✅ [Auth] User data loaded:', userData.user);
          } else {
            console.log('❌ [Auth] User not found in database:', firebaseUser.email);
            setDbUser(null);
          }
        } catch (error) {
          console.error('❌ [Auth] Error fetching user data:', error);
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
    } catch (error) {
      console.error('Error signing out:', error);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}