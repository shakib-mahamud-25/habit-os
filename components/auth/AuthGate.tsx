'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from './LoginScreen';

/** Shows nothing but a loading state until Firebase resolves whether someone
 *  is signed in, then either the login screen or the real app. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="muted" style={{ fontSize: 13.5 }}>Loading Habit OS…</div>
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
