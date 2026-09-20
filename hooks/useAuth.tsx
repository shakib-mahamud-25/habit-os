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
    console.log(TAG, 'checking for a pending redirect result…');

    // Surfaces errors from the redirect flow itself (blocked popup fallback,
    // account-exists-with-different-credential, etc). The actual signed-in
    // state always comes from onAuthStateChanged below, not from here --
    // this is purely for error reporting/diagnostics after the redirect
    // returns.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log(TAG, 'getRedirectResult: got a signed-in user ->', result.user.uid, result.user.email);
        } else {
          console.log(TAG, 'getRedirectResult: resolved with NULL (no pending redirect found). ' +
            'If you just came back from Google\'s account picker, this usually means the browser blocked ' +
            'the storage/iframe Firebase needs to complete the redirect -- try a different browser profile ' +
            '(e.g. not a School/Workspace-managed one) or disable any ad-blocker/privacy extension for this site.');
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
    console.log(TAG, 'starting signInWithRedirect…');
    // Redirect (not popup): popups are unreliable inside installed PWA
    // windows, especially on iOS.
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
