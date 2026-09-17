'use client';
import { useMemo } from 'react';
import { CircleCheck, Star } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { HabitRow } from '@/components/habits/HabitRow';
import { activeHabits } from '@/lib/analytics';
import { todayISO, fmtLong } from '@/lib/dates';

export default function TodayPage() {
  const { habits, categories, completionIndex, toggleCompletion } = useAppData();
  const active = useMemo(() => activeHabits(habits), [habits]);
  const today = todayISO();
  const done = active.filter((h) => completionIndex.get(`${today}__${h.id}`)?.completed).length;
  const pct = active.length ? Math.round((done / active.length) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page fade-in" style={{ maxWidth: 640 }}>
      <PageHeader title={greet} subtitle={fmtLong(today)} />
      {active.length === 0 ? (
        <EmptyState icon={CircleCheck} title="No active habits yet" subtitle="Add a habit to start tracking today." />
      ) : (
        <>
          <div className="surface card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="card-title" style={{ margin: 0 }}>Today&apos;s progress</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 18 }}>{pct}%</div>
            </div>
            <ProgressBar pct={pct} />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{done} of {active.length} completed</div>
          </div>
          <div className="surface" style={{ padding: 6 }}>
            {active.map((h) => {
              const rec = completionIndex.get(`${today}__${h.id}`);
              const isDone = !!(rec && rec.completed);
              const cat = categories.find((c) => c.id === h.categoryId);
              return (
                <HabitRow key={h.id} habit={h} category={cat} done={isDone} onToggle={() => toggleCompletion(today, h.id)} />
              );
            })}
          </div>
          {done === active.length && active.length > 0 && (
            <div className="surface card" style={{ marginTop: 16, textAlign: 'center', background: 'var(--accent-soft)', borderColor: 'var(--accent-soft)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Star size={16} /> Perfect day. Every habit checked off.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
