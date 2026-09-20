'use client';
import type { ReactNode } from 'react';
import { Habit, DailyCompletion } from '@/types';
import { addDaysISO, todayISO, parseISO } from '@/lib/dates';
import { intensityColor } from './intensity';

export function Heatmap({ habits, index, ring }: { habits: Habit[]; index: Map<string, DailyCompletion>; ring: string }) {
  const today = todayISO();
  const days: string[] = [];
  for (let i = 83; i >= 0; i--) days.push(addDaysISO(today, -i));
  const startDow = parseISO(days[0]).getDay();
  const padded: Array<string | null> = Array(startDow).fill(null).concat(days);
  const cols = Math.ceil(padded.length / 7);
  const cells: ReactNode[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const idx = c * 7 + r;
      const ds = padded[idx];
      if (!ds) { cells.push(<div key={`${c}-${r}`} className="heat-cell" style={{ background: 'transparent' }} />); continue; }
      let done = 0, total = 0;
      for (const h of habits) {
        if (h.createdAt > parseISO(ds).getTime() + 86400000) continue;
        total++;
        const rec = index.get(`${ds}__${h.id}`);
        if (rec && rec.completed) done++;
      }
      const pct = total ? (done / total) * 100 : 0;
      cells.push(<div key={ds} className="heat-cell" title={`${ds}: ${Math.round(pct)}%`} style={{ background: intensityColor(pct, ring) }} />);
    }
  }

  // 10-step legend at 10% intervals, using the exact same ramp as the cells above.
  const steps = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

  return (
    <div>
      <div className="heat-grid">{cells}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <span className="muted" style={{ fontSize: 11 }}>0%</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {steps.map((p) => (
            <span
              key={p}
              title={`${p}%`}
              style={{ width: 16, height: 10, background: intensityColor(p, ring), border: '1px solid var(--border)' }}
            />
          ))}
        </div>
        <span className="muted" style={{ fontSize: 11 }}>100%</span>
      </div>
    </div>
  );
}
