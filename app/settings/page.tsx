'use client';
import { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ThemeMode, WeekStart } from '@/types';

export default function SettingsPage() {
  const { settings, saveSettings, resetAll } = useAppData();
  const { toast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="page fade-in" style={{ maxWidth: 640 }}>
      <PageHeader title="Settings" subtitle="Appearance, tracking and data preferences" />

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">Appearance</div><div className="card-sub">Choose how Habit OS looks</div>
        <div className="seg">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((t) => (
            <button key={t} className={settings.theme === t ? 'active' : ''} onClick={() => saveSettings({ theme: t })}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">Tracking</div><div className="card-sub">Calendar and week preferences</div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label className="field-label">Week starts on</label>
          <select value={settings.weekStart} onChange={(e) => saveSettings({ weekStart: e.target.value as WeekStart })}>
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 320, marginBottom: 0 }}>
          <label className="field-label">Overall streak definition</label>
          <select value={settings.overallStreakMode} disabled>
            <option value="all">All active habits completed</option>
          </select>
          <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
            A day counts toward your overall streak when every active habit scheduled for that day is completed.
          </div>
        </div>
      </div>

      <div className="surface card">
        <div className="card-title">Data</div><div className="card-sub">Manage your stored data</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/data" className="btn"><Database size={15} /> Open Data &amp; Backup</Link>
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}><Trash2 size={15} /> Reset all data</button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset all data?"
          body="This deletes every habit, category, completion and reflection stored on this device and restores the default starter set. This cannot be undone."
          confirmLabel="Reset data"
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => { await resetAll(); setConfirmReset(false); toast('Data reset to defaults'); }}
        />
      )}
    </div>
  );
}
