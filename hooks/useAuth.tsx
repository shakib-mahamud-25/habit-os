'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const TAG = '[HabitOS Auth]';

// DIAGNOSTIC MODE: temporarily using signInWithPopup instead of
// signInWithRedirect, to isolate whether the sync issue is specific to the
// redirect flow. Safe to flip back to false once we know which one works --
// see the comment above signInWithGoogle below.
const USE_POPUP_FOR_TESTING = true;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(TAG, 'checking for a pending redirect result…');

    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log(TAG, 'getRedirectResult: got a signed-in user ->', result.user.uid, result.user.email);
        } else {
          console.log(TAG, 'getRedirectResult: resolved with NULL (no pending redirect found).');
        }
      })
      .catch((err) => {
        const code = (err as { code?: string })?.code;
        console.error(TAG, 'getRedirectResult FAILED:', code, err);
        setError(err instanceof Error ? `${code ? `[${code}] ` : ''}${err.message}` : 'Sign-in failed. Please try again.');
      });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log(TAG, 'onAuthStateChanged fired ->', u ? `signed in as ${u.uid} (${u.email})` : 'signed out / no user');
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (USE_POPUP_FOR_TESTING) {
      console.log(TAG, 'starting signInWithPopup (diagnostic mode)…');
      try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log(TAG, 'signInWithPopup SUCCEEDED ->', result.user.uid, result.user.email);
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.error(TAG, 'signInWithPopup FAILED:', code, err);
        setError(err instanceof Error ? `${code ? `[${code}] ` : ''}${err.message}` : 'Sign-in failed. Please try again.');
      }
      return;
    }
    console.log(TAG, 'starting signInWithRedirect…');
    await signInWithRedirect(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    console.log(TAG, 'signing out');
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
