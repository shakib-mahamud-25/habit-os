'use client';
import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { buildBackupPayload, downloadJSON, downloadCSV, validateBackupPayload } from '@/lib/export';

export default function DataPage() {
  const { habits, categories, completions, monthlyPlans, reflections, settings, importBackup } = useAppData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const doExportJSON = () => {
    downloadJSON(buildBackupPayload({ habits, categories, completions, monthlyPlans, reflections, settings }));
    toast('Backup exported');
  };
  const doExportCSV = () => { downloadCSV(habits, categories, completions); toast('CSV exported'); };

  const doImport = async (mode: 'merge' | 'replace') => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast('Choose a file first'); return; }
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!validateBackupPayload(data)) { toast("This file doesn't look like a valid backup"); return; }
      await importBackup(data, mode);
      toast(mode === 'replace' ? 'Data replaced from backup' : 'Backup merged');
    } catch {
      toast('Import failed: invalid JSON file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 640 }}>
      <PageHeader title="Data & Backup" subtitle="Everything stays on this device unless you export it" />

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">What&apos;s stored locally</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {habits.length} habits · {categories.length} categories · {completions.length} completion records · {reflections.length} reflections
        </div>
      </div>

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">Export backup</div><div className="card-sub">Download a full JSON backup of your data</div>
        <button className="btn btn-primary" onClick={doExportJSON}><Download size={15} /> Export backup</button>
      </div>

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">Import backup</div><div className="card-sub">Restore from a previously exported JSON file</div>
        <input ref={fileRef} type="file" accept="application/json" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" disabled={busy} onClick={() => doImport('merge')}><Upload size={15} /> Merge with existing</button>
          <button className="btn btn-danger" disabled={busy} onClick={() => doImport('replace')}>Replace everything</button>
        </div>
      </div>

      <div className="surface card">
        <div className="card-title">CSV export</div><div className="card-sub">Export your completion history as a spreadsheet</div>
        <button className="btn" onClick={doExportCSV}><Download size={15} /> Export CSV</button>
      </div>
    </div>
  );
}
