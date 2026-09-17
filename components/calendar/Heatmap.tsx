'use client';
import type { ReactNode } from 'react';
import { Habit, DailyCompletion } from '@/types';
import { addDaysISO, todayISO, parseISO } from '@/lib/dates';

function intensityColor(pct: number, ring: string): string {
  if (pct <= 0) return 'var(--surface-2)';
  const a = 0.15 + Math.min(pct, 100) / 100 * 0.6;
  return `rgba(${ring},${a.toFixed(2)})`;
}

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
  return <div className="heat-grid">{cells}</div>;
}
