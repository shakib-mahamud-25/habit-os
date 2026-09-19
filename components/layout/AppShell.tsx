'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CircleCheck, Table2, CalendarDays, BarChart3, ListChecks,
  History, Settings as SettingsIcon, Database, Menu, X, Sun, Moon, Monitor,
} from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { Footer } from './Footer';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

const NAV_PRIMARY = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: CircleCheck },
  { href: '/tracker', label: 'Tracker', icon: Table2 },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/habits', label: 'Habits', icon: ListChecks },
  { href: '/history', label: 'History', icon: History },
];
const NAV_SECONDARY = [
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
  { href: '/data', label: 'Data & Backup', icon: Database },
];
const MOBILE_PRIMARY = [
  { href: '/today', label: 'Today', icon: CircleCheck },
  { href: '/tracker', label: 'Tracker', icon: Table2 },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
];
const MORE_PAGES = ['/analytics', '/habits', '/history', '/settings', '/data'];

function ThemeToggleLabel({ theme }: { theme: string }) {
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';
  return <><Icon size={17} /><span>Theme: {label}</span></>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, saveSettings, loading, error } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);

  const cycleTheme = () => {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(settings.theme) + 1) % 3];
    saveSettings({ theme: next });
  };

  if (error) {
    return (
      <div style={{ padding: 40, maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <h2>Couldn&apos;t start Habit OS</h2>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return (
    <div id="app-root">
      <div className="sidebar">
        <Link href="/dashboard" className="brand" style={{ textDecoration: 'none' }}>Habit OS</Link>
        <nav className="nav-group">
          {NAV_PRIMARY.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
              <Icon size={17} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-sep" />
        <nav className="nav-group">
          {NAV_SECONDARY.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
              <Icon size={17} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-item" onClick={cycleTheme}><ThemeToggleLabel theme={settings.theme} /></button>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <Link href="/dashboard" className="brand" style={{ padding: 0, textDecoration: 'none' }}>Habit OS</Link>
          <button className="icon-btn" onClick={() => setSheetOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
        </div>
        <div id="page-content">{loading ? <LoadingState /> : children}</div>
        {!loading && <Footer />}
      </div>
      <InstallPrompt />

      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`bnav-item ${pathname === href ? 'active' : ''}`}>
              <Icon size={20} /><span>{label}</span>
            </Link>
          ))}
          <button
            className={`bnav-item ${MORE_PAGES.includes(pathname) ? 'active' : ''}`}
            onClick={() => setSheetOpen(true)}
          >
            <Menu size={20} /><span>More</span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <>
          <div className="sheet-back" onClick={() => setSheetOpen(false)} />
          <div className="sheet">
            <div className="grab" />
            {[...NAV_PRIMARY, ...NAV_SECONDARY].map(({ href, label, icon: Icon }) => (
              <Link
                key={href} href={href} onClick={() => setSheetOpen(false)}
                className="nav-item" style={{ fontSize: 15, minHeight: 44 }}
              >
                <Icon size={18} /><span>{label}</span>
              </Link>
            ))}
            <div className="nav-sep" />
            <button className="nav-item" style={{ fontSize: 15, minHeight: 44 }} onClick={cycleTheme}>
              <ThemeToggleLabel theme={settings.theme} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="page">
      <div className="empty-state">
        <div className="t">Loading Habit OS…</div>
        <div className="s">Reading your local data.</div>
      </div>
    </div>
  );
}
