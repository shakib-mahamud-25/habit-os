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
  // Tracks whether we're still waiting on getRedirectResult() to settle.
  // We hold `loading: true` until BOTH the redirect check and the first
  // onAuthStateChanged callback have fired, so AuthGate never flashes the
  // login screen in the gap between "redirect result: null" (expected on
  // first return) and "onAuthStateChanged: signed in" (arrives a moment
  // later once Firebase's persisted session hydrates).
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [authStateChecked, setAuthStateChecked] = useState(false);

  useEffect(() => {
    console.log(TAG, 'checking for a pending redirect result…');

    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log(TAG, 'getRedirectResult: got a signed-in user ->', result.user.uid, result.user.email);
          // Setting user here too (not just relying on onAuthStateChanged)
          // closes the race where onAuthStateChanged hasn't fired yet but
          // we already know, definitively, that sign-in succeeded.
          setUser(result.user);
        } else {
          console.log(TAG, 'getRedirectResult: resolved with NULL (no pending redirect found).');
        }
      })
      .catch((err) => {
        const code = (err as { code?: string })?.code;
        console.error(TAG, 'getRedirectResult FAILED:', code, err);
        setError(err instanceof Error ? `${code ? `[${code}] ` : ''}${err.message}` : 'Sign-in failed. Please try again.');
      })
      .finally(() => setRedirectChecked(true));

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log(TAG, 'onAuthStateChanged fired ->', u ? `signed in as ${u.uid} (${u.email})` : 'signed out / no user');
      setUser(u);
      setAuthStateChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (redirectChecked && authStateChecked) setLoading(false);
  }, [redirectChecked, authStateChecked]);

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
