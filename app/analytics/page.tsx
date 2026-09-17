'use client';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useChartColors } from '@/hooks/useChartColors';
import { ensureChartsRegistered } from '@/components/charts/registerCharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { activeHabits, monthStats, habitPerformance, categoryPerformance, dayOfWeekConsistency } from '@/lib/analytics';
import { habitStreaks } from '@/lib/streaks';

ensureChartsRegistered();

export default function AnalyticsPage() {
  const { habits, categories, completions, monthlyPlans, activeMonth, completionIndex } = useAppData();
  const colors = useChartColors();
  const { year, month } = activeMonth;

  const active = useMemo(() => activeHabits(habits), [habits]);
  const stats = useMemo(() => monthStats(year, month, habits, completionIndex), [year, month, habits, completionIndex]);
  const perf = useMemo(() => habitPerformance(year, month, habits, completions, monthlyPlans), [year, month, habits, completions, monthlyPlans]);
  const catPerf = useMemo(() => categoryPerformance(year, month, habits, categories, completions, monthlyPlans), [year, month, habits, categories, completions, monthlyPlans]);
  const totalHistDays = useMemo(() => new Set(completions.filter((c) => c.completed).map((c) => c.date)).size, [completions]);
  const enoughHistory = totalHistDays >= 10;
  const dowPct = useMemo(() => dayOfWeekConsistency(completions), [completions]);
  const bestOverall = useMemo(() => Math.max(0, ...habits.map((h) => habitStreaks(h.id, completions).best)), [habits, completions]);

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.text } },
      y: { min: 0, max: 100, grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v: string | number) => `${v}%` } },
    },
  };

  if (habits.length === 0) {
    return (
      <div className="page fade-in">
        <PageHeader title="Analytics" subtitle="Deeper trends and patterns" right={<MonthSelector />} />
        <EmptyState icon={BarChart3} title="Not enough data yet" subtitle="Complete a few days to unlock meaningful trends." />
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <PageHeader title="Analytics" subtitle="Deeper trends and patterns" right={<MonthSelector />} />

      <div className="kpi-grid">
        <KpiCard label="Overall completion" value={`${stats.pct}%`} />
        <KpiCard label="Avg. daily completion" value={stats.countedDays ? `${Math.round(stats.completed / stats.countedDays)}/${active.length}` : '—'} />
        <KpiCard label="Perfect days" value={stats.perfectDays} />
        <KpiCard label="Longest streak ever" value={`${bestOverall} days`} />
      </div>

      <div className="surface card" style={{ marginBottom: 14 }}>
        <div className="card-title">Habit analysis</div>
        <div className="card-sub">Goal vs. actual, streaks and consistency, this month</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Habit</th>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Goal</th>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Actual</th>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Progress</th>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Current streak</th>
                <th style={{ padding: '8px 10px', fontWeight: 500 }}>Best streak</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={p.habit.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 500 }}>
                    <span className="habit-dot" style={{ background: p.habit.color, display: 'inline-block', marginRight: 8 }} />
                    {p.habit.name}
                  </td>
                  <td style={{ padding: '9px 10px' }}>{p.goal}</td>
                  <td style={{ padding: '9px 10px' }}>{p.actual}</td>
                  <td style={{ padding: '9px 10px', width: 140 }}><ProgressBar pct={p.pct} /></td>
                  <td style={{ padding: '9px 10px' }}>{p.streak.current}d</td>
                  <td style={{ padding: '9px 10px' }}>{p.streak.best}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="surface card">
          <div className="card-title">Category analysis</div><div className="card-sub">Goal completion by category</div>
          <div style={{ height: 220 }}>
            <Bar
              data={{ labels: catPerf.map((c) => c.cat.name), datasets: [{ data: catPerf.map((c) => c.pct), backgroundColor: catPerf.map((c) => c.cat.color), borderRadius: 6, barThickness: 16 }] }}
              options={{ indexAxis: 'y' as const, ...chartOpts, scales: { x: chartOpts.scales.y, y: { grid: { display: false }, ticks: { color: colors.text } } } }}
            />
          </div>
        </div>
        <div className="surface card">
          <div className="card-title">Day-of-week consistency</div>
          <div className="card-sub">{enoughHistory ? 'All-time completion by weekday' : 'Needs more history'}</div>
          {enoughHistory ? (
            <div style={{ height: 220 }}>
              <Bar
                data={{ labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ data: dowPct, backgroundColor: colors.accent, borderRadius: 6 }] }}
                options={chartOpts}
              />
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="Not enough historical data yet." subtitle="Keep tracking daily — this chart unlocks once you have about two weeks of history." />
          )}
        </div>
      </div>
    </div>
  );
}
