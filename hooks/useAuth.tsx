'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // auth.authStateReady() is Firebase's own documented fix for the
    // pendingRedirect race (firebase/firebase-js-sdk#6827): it resolves
    // only once Auth has fully finished its internal boot sequence --
    // including consuming any pending redirect result -- so nothing here
    // can run ahead of that and see a stale/incomplete state.
    (async () => {
      console.log(TAG, 'waiting for auth.authStateReady()…');
      try {
        await auth.authStateReady();
      } catch (err) {
        console.error(TAG, 'authStateReady() rejected (unexpected):', err);
      }
      if (cancelled) return;
      console.log(TAG, 'authStateReady() resolved. auth.currentUser ->', auth.currentUser?.uid || 'null');

      // getRedirectResult still needs to be called (even after
      // authStateReady) to surface any *error* from the redirect flow
      // itself, and to get the AdditionalUserInfo Firebase only attaches
      // to this specific call. It no longer races onAuthStateChanged --
      // authStateReady already guarantees the underlying state is settled.
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log(TAG, 'getRedirectResult: got a signed-in user ->', result.user.uid, result.user.email);
        } else {
          console.log(TAG, 'getRedirectResult: NULL (no pending redirect, or already consumed by authStateReady()).');
        }
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.error(TAG, 'getRedirectResult FAILED:', code, err);
        if (!cancelled) {
          setError(err instanceof Error ? `${code ? `[${code}] ` : ''}${err.message}` : 'Sign-in failed. Please try again.');
        }
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log(TAG, 'onAuthStateChanged fired ->', u ? `signed in as ${u.uid} (${u.email})` : 'signed out / no user');
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    console.log(TAG, 'starting signInWithRedirect…');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      console.error(TAG, 'signInWithRedirect FAILED to start:', code, err);
      setError(err instanceof Error ? `${code ? `[${code}] ` : ''}${err.message}` : 'Sign-in failed. Please try again.');
    }
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
