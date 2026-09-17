'use client';
import { Habit, DailyCompletion, WeekStart } from '@/types';
import { daysInMonth, todayISO, iso, parseISO } from '@/lib/dates';

function intensityColor(pct: number, ring: string): string {
  if (pct <= 0) return 'var(--surface-2)';
  const a = 0.15 + Math.min(pct, 100) / 100 * 0.6;
  return `rgba(${ring},${a.toFixed(2)})`;
}

export function MonthlyCalendar({
  year, month, habits, index, weekStart, ring, onOpenDay,
}: {
  year: number; month: number; habits: Habit[]; index: Map<string, DailyCompletion>;
  weekStart: WeekStart; ring: string; onOpenDay: (date: string) => void;
}) {
  const dim = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const ws = weekStart === 'sunday' ? 0 : 1;
  const lead = (firstDow - ws + 7) % 7;
  const dowLabels = weekStart === 'sunday'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = todayISO();

  const cells: Array<number | null> = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  return (
    <div className="surface card">
      <div className="cal-grid" style={{ marginBottom: 6 }}>
        {dowLabels.map((l) => <div key={l} className="cal-dow">{l}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="cal-cell empty" />;
          const ds = iso(year, month, d);
          const future = ds > today;
          let doneN = 0, totalN = 0;
          for (const h of habits) {
            if (h.createdAt > parseISO(ds).getTime() + 86400000) continue;
            totalN++;
            const rec = index.get(`${ds}__${h.id}`);
            if (rec && rec.completed) doneN++;
          }
          const pct = totalN ? Math.round((doneN / totalN) * 100) : 0;
          const bg = future ? 'var(--surface)' : intensityColor(pct, ring);
          return (
            <button
              key={ds} className={`cal-cell ${ds === today ? 'today' : ''}`}
              style={{ background: bg, cursor: future ? 'default' : 'pointer' }}
              onClick={() => !future && onOpenDay(ds)}
              disabled={future}
            >
              <span className="d">{d}</span>
              {!future && <span className="p">{pct}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
