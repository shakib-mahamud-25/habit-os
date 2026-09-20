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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log(TAG, 'waiting for auth.authStateReady()…');
      try {
        await auth.authStateReady();
      } catch (err) {
        console.error(TAG, 'authStateReady() rejected (unexpected):', err);
      }
      if (cancelled) return;

      // Only relevant if signInWithGoogle had to fall back to redirect
      // (see below) -- picks up the result on return. On a normal popup
      // sign-in this always resolves null, which is expected and fine.
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log(TAG, 'getRedirectResult: got a signed-in user ->', result.user.uid, result.user.email);
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
    // Popup is the primary method: the main window/tab never navigates
    // away, so it has no dependency on sessionStorage (or any other
    // per-navigation state) surviving a round trip to accounts.google.com.
    // That dependency is what was actually breaking sign-in here --
    // sessionStorage was coming back empty after the redirect round trip
    // in this environment, regardless of Firebase SDK version.
    console.log(TAG, 'starting signInWithPopup…');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(TAG, 'signInWithPopup SUCCEEDED ->', result.user.uid, result.user.email);
      return;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // These specific codes mean the popup itself couldn't open/complete
      // (blocked by the browser, or the environment is a webview that
      // doesn't support window.open reliably) -- fall back to redirect
      // rather than just failing. Any other error (e.g. the user closing
      // the popup) is reported as-is, no fallback.
      const popupUnavailable = code === 'auth/popup-blocked'
        || code === 'auth/operation-not-supported-in-this-environment'
        || code === 'auth/cancelled-popup-request';
      if (popupUnavailable) {
        console.warn(TAG, `signInWithPopup unavailable (${code}), falling back to signInWithRedirect…`);
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          const rCode = (redirectErr as { code?: string })?.code;
          console.error(TAG, 'signInWithRedirect fallback FAILED to start:', rCode, redirectErr);
          setError(redirectErr instanceof Error ? `${rCode ? `[${rCode}] ` : ''}${redirectErr.message}` : 'Sign-in failed. Please try again.');
        }
        return;
      }
      console.error(TAG, 'signInWithPopup FAILED:', code, err);
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
