'use client';
import { useAuth } from '@/hooks/useAuth';

export function LoginScreen() {
  const { signInWithGoogle, error, loading } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="surface card" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Habit OS</div>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 22, lineHeight: 1.5 }}>
          Track → Analyze → Reflect → Improve.<br />Sign in to sync your habits across every device.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
          onClick={() => signInWithGoogle()}
          disabled={loading}
        >
          Continue with Google
        </button>
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 14 }}>{error}</div>
        )}
      </div>
    </div>
  );
}
