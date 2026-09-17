'use client';
import { useMemo, useState } from 'react';
import { Check, Download, History as HistoryIcon } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { downloadCSV } from '@/lib/export';

type Tab = 'records' | 'reflection';

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('records');
  const { habits, categories, completions, activeMonth, reflections, saveReflection } = useAppData();
  const { toast } = useToast();

  const [habitFilter, setHabitFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const rows = useMemo(() => {
    let list = completions
      .filter((c) => c.completed)
      .map((c) => {
        const habit = habits.find((h) => h.id === c.habitId);
        const cat = habit ? categories.find((cc) => cc.id === habit.categoryId) : undefined;
        return { ...c, habit, cat };
      })
      .filter((r) => !!r.habit);
    if (habitFilter !== 'all') list = list.filter((r) => r.habitId === habitFilter);
    if (categoryFilter !== 'all') list = list.filter((r) => r.cat && r.cat.id === categoryFilter);
    if (from) list = list.filter((r) => r.date >= from);
    if (to) list = list.filter((r) => r.date <= to);
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 300);
  }, [completions, habits, categories, habitFilter, categoryFilter, from, to]);

  const reflection = reflections.find((r) => r.year === activeMonth.year && r.month === activeMonth.month);

  return (
    <div className="page fade-in">
      <PageHeader title="History" subtitle="Records, filters and reflections" />
      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>Records</button>
        <button className={tab === 'reflection' ? 'active' : ''} onClick={() => setTab('reflection')}>Reflection</button>
      </div>

      {tab === 'records' ? (
        <>
          <div className="surface card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              <div>
                <label className="field-label">Habit</label>
                <select value={habitFilter} onChange={(e) => setHabitFilter(e.target.value)}>
                  <option value="all">All habits</option>
                  {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="field-label">From</label><input type="text" placeholder="YYYY-MM-DD" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><label className="field-label">To</label><input type="text" placeholder="YYYY-MM-DD" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
          </div>
          <div className="surface" style={{ overflowX: 'auto' }}>
            {rows.length === 0 ? (
              <EmptyState icon={HistoryIcon} title="Your history will appear here as you build consistency." subtitle="Once you complete habits, records will show up in this list." />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '10px 14px', fontWeight: 500 }}>Habit</th>
                    <th style={{ padding: '10px 14px', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '10px 14px', fontWeight: 500 }}>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 14px' }}>{r.date}</td>
                      <td style={{ padding: '9px 14px' }}>{r.habit?.name}</td>
                      <td style={{ padding: '9px 14px' }}>{r.cat?.name || '—'}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--accent)', fontWeight: 600 }}><Check size={15} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {rows.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => { downloadCSV(habits, categories, completions); toast('CSV exported'); }}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="page-header" style={{ marginBottom: 14 }}><MonthSelector /></div>
          <div className="surface card">
            <ReflectionForm
              key={`${activeMonth.year}-${activeMonth.month}`}
              year={activeMonth.year} month={activeMonth.month}
              initial={reflection}
              onSave={async (data) => { await saveReflection(activeMonth.year, activeMonth.month, data); toast('Reflection saved'); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ReflectionForm({
  year, month, initial, onSave,
}: {
  year: number; month: number;
  initial?: { worked: string; didNotWork: string; biggestWin: string; improvement: string; notes: string };
  onSave: (data: { worked: string; didNotWork: string; biggestWin: string; improvement: string; notes: string }) => void;
}) {
  const [worked, setWorked] = useState(initial?.worked || '');
  const [didNotWork, setDidNotWork] = useState(initial?.didNotWork || '');
  const [biggestWin, setBiggestWin] = useState(initial?.biggestWin || '');
  const [improvement, setImprovement] = useState(initial?.improvement || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ worked, didNotWork, biggestWin, improvement, notes }); }}>
      <div className="field"><label className="field-label">What worked?</label><textarea value={worked} onChange={(e) => setWorked(e.target.value)} /></div>
      <div className="field"><label className="field-label">What didn&apos;t work?</label><textarea value={didNotWork} onChange={(e) => setDidNotWork(e.target.value)} /></div>
      <div className="field"><label className="field-label">Biggest win</label><textarea value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)} /></div>
      <div className="field"><label className="field-label">One thing to improve</label><textarea value={improvement} onChange={(e) => setImprovement(e.target.value)} /></div>
      <div className="field"><label className="field-label">Additional notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <button type="submit" className="btn btn-primary">Save reflection</button>
    </form>
  );
}
