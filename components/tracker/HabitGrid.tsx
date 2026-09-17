'use client';
import { useRef } from 'react';
import { Habit, DailyCompletion, MonthlyPlan } from '@/types';
import { daysInMonth, iso, isWeekend, todayISO } from '@/lib/dates';
import { goalFor, monthActualCount } from '@/lib/analytics';
import { HabitCheckbox } from '@/components/habits/HabitCheckbox';

export function HabitGrid({
  habits, year, month, index, monthlyPlans, onToggle,
}: {
  habits: Habit[]; year: number; month: number; index: Map<string, DailyCompletion>;
  monthlyPlans: MonthlyPlan[]; onToggle: (date: string, habitId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dim = daysInMonth(year, month);
  const today = todayISO();

  return (
    <div className="tracker-wrap" ref={scrollRef}>
      <table className="tracker">
        <thead>
          <tr>
            <th className="tr-habit-col">Habit</th>
            {Array.from({ length: dim }, (_, i) => {
              const d = i + 1;
              const ds = iso(year, month, d);
              const we = isWeekend(year, month, d);
              const isToday = ds === today;
              return <th key={d} className={`${we ? 'weekend' : ''} ${isToday ? 'today-col' : ''}`}>{d}</th>;
            })}
            <th className="tr-stat-col">Goal</th>
            <th className="tr-stat-col">Actual</th>
            <th className="tr-stat-col">%</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const goal = goalFor(h, year, month, monthlyPlans) || 1;
            const actual = monthActualCount(h.id, year, month, index);
            const pct = Math.min(100, Math.round((actual / goal) * 100));
            return (
              <tr key={h.id}>
                <td className="tr-habit-col">
                  <span className="habit-dot" style={{ background: h.color, display: 'inline-block', marginRight: 8 }} />
                  {h.name}
                </td>
                {Array.from({ length: dim }, (_, i) => {
                  const d = i + 1;
                  const ds = iso(year, month, d);
                  const we = isWeekend(year, month, d);
                  const isToday = ds === today;
                  const future = ds > today;
                  const rec = index.get(`${ds}__${h.id}`);
                  const done = !!(rec && rec.completed);
                  return (
                    <td key={d} className={`day-cell ${we ? 'weekend' : ''} ${isToday ? 'today-col' : ''}`}>
                      <HabitCheckbox
                        size="sm" done={done} disabled={future}
                        onToggle={() => onToggle(ds, h.id)} label={`${h.name} ${ds}`}
                      />
                    </td>
                  );
                })}
                <td className="tr-stat-col">{goal}</td>
                <td className="tr-stat-col">{actual}</td>
                <td className="tr-stat-col" style={{ fontWeight: 600, color: pct >= 100 ? 'var(--accent)' : 'var(--text)' }}>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
