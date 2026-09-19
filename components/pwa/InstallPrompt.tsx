'use client';
import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'habitos_install_dismissed_at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag for "already added to home screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed, never show

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
    if (recentlyDismissed) return;

    if (isIOS()) {
      setIos(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setVisible(false);
    if (choice.outcome === 'dismissed') localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Download size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>Install Habit OS</div>
        <div className="muted" style={{ fontSize: 12 }}>
          {ios
            ? <>Tap <Share size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Share, then &quot;Add to Home Screen&quot;</>
            : 'Add it to your home screen for quick, offline access.'}
        </div>
      </div>
      {!ios && (
        <button className="btn btn-primary btn-sm" onClick={install}>Install</button>
      )}
      <button className="icon-btn" onClick={dismiss} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}
