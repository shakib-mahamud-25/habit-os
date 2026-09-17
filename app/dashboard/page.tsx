'use client';
import { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { LayoutDashboard, PenLine } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useChartColors } from '@/hooks/useChartColors';
import { ensureChartsRegistered } from '@/components/charts/registerCharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  activeHabits, monthStats, habitPerformance, categoryPerformance, weeklyPerformance, monthCompletionSeries,
} from '@/lib/analytics';
import { overallStreak } from '@/lib/streaks';
import { todayISO, fmtLong } from '@/lib/dates';

ensureChartsRegistered();

export default function DashboardPage() {
  const { habits, categories, completions, monthlyPlans, reflections, activeMonth, completionIndex } = useAppData();
  const colors = useChartColors();
  const { year, month } = activeMonth;

  const active = useMemo(() => activeHabits(habits), [habits]);
  const stats = useMemo(() => monthStats(year, month, habits, completionIndex), [year, month, habits, completionIndex]);
  const streak = useMemo(() => overallStreak(active, completions), [active, completions]);
  const perf = useMemo(() => habitPerformance(year, month, habits, completions, monthlyPlans), [year, month, habits, completions, monthlyPlans]);
  const catPerf = useMemo(() => categoryPerformance(year, month, habits, categories, completions, monthlyPlans), [year, month, habits, categories, completions, monthlyPlans]);
  const weekly = useMemo(() => weeklyPerformance(year, month, habits, completions), [year, month, habits, completions]);
  const series = useMemo(() => monthCompletionSeries(year, month, habits, completionIndex), [year, month, habits, completionIndex]);

  const best = perf[0];
  const worst = [...perf].sort((a, b) => a.pct - b.pct)[0];
  const today = todayISO();
  const todayDone = active.filter((h) => completionIndex.get(`${today}__${h.id}`)?.completed).length;
  const todayPct = active.length ? Math.round((todayDone / active.length) * 100) : 0;
  const reflection = reflections.find((r) => r.year === year && r.month === month);

  if (habits.length === 0) {
    return (
      <div className="page fade-in">
        <PageHeader title="Dashboard" subtitle="How this month is going" right={<MonthSelector />} />
        <EmptyState icon={LayoutDashboard} title="Add your first habit to start building your system." subtitle="Once you create habits, your dashboard will fill in with real progress." />
      </div>
    );
  }

  const chartOpts = (max = 100) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.text } },
      y: { min: 0, max, grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v: string | number) => `${v}%` } },
    },
  });

  return (
    <div className="page fade-in">
      <PageHeader title="Dashboard" subtitle="How this month is going" right={<MonthSelector />} />

      <div className="kpi-grid">
        <KpiCard label="Overall completion" value={`${stats.pct}%`} />
        <KpiCard label="Completed" value={stats.completed} />
        <KpiCard label="Remaining" value={stats.remaining} />
        <KpiCard label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
      </div>

      <div className="grid-3" style={{ marginBottom: 14 }}>
        <div className="surface card">
          <div className="card-title">Perfect days</div><div className="card-sub">All active habits done</div>
          <div className="kpi-value" style={{ fontSize: 24 }}>{stats.perfectDays} <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>/ {stats.countedDays}</span></div>
        </div>
        <div className="surface card">
          <div className="card-title">Best habit</div><div className="card-sub">Highest goal progress</div>
          {best ? <><div style={{ fontWeight: 600, fontSize: 14.5 }}>{best.habit.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{best.pct}% of goal</div></> : <div className="muted">—</div>}
        </div>
        <div className="surface card">
          <div className="card-title">Needs attention</div><div className="card-sub">Lowest goal progress</div>
          {worst ? <><div style={{ fontWeight: 600, fontSize: 14.5 }}>{worst.habit.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{worst.pct}% of goal</div></> : <div className="muted">—</div>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="surface card">
          <div className="card-title">Monthly completion trend</div><div className="card-sub">Daily completion percentage</div>
          <div style={{ height: 220 }}>
            <Line
              data={{
                labels: series.map((_, i) => i + 1),
                datasets: [{ data: series, borderColor: colors.accent, backgroundColor: `${colors.accent}22`, fill: true, tension: 0.35, pointRadius: 0, spanGaps: true }],
              }}
              options={chartOpts()}
            />
          </div>
        </div>
        <div className="surface card">
          <div className="card-title">Today</div><div className="card-sub">{fmtLong(today)}</div>
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <div className="kpi-value" style={{ fontSize: 34 }}>{todayPct}%</div>
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{todayDone} of {active.length} habits</div>
            <ProgressBar pct={todayPct} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="surface card">
          <div className="card-title">Habit performance</div><div className="card-sub">% of monthly goal reached</div>
          <div style={{ height: Math.max(180, perf.length * 34) }}>
            <Bar
              data={{ labels: perf.map((p) => p.habit.name), datasets: [{ data: perf.map((p) => p.pct), backgroundColor: perf.map((p) => p.habit.color), borderRadius: 5, barThickness: 16 }] }}
              options={{ indexAxis: 'y' as const, ...chartOpts(), scales: { x: chartOpts().scales.y, y: { grid: { display: false }, ticks: { color: colors.text } } } }}
            />
          </div>
        </div>
        <div className="surface card">
          <div className="card-title">Weekly performance</div><div className="card-sub">Completion rate by week</div>
          <div style={{ height: 220 }}>
            <Bar
              data={{ labels: weekly.map((w) => w.label), datasets: [{ data: weekly.map((w) => w.pct), backgroundColor: colors.accent, borderRadius: 6 }] }}
              options={chartOpts()}
            />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="surface card">
          <div className="card-title">Category performance</div><div className="card-sub">Goal progress by category</div>
          <div style={{ height: 220 }}>
            <Bar
              data={{ labels: catPerf.map((c) => c.cat.name), datasets: [{ data: catPerf.map((c) => c.pct), backgroundColor: catPerf.map((c) => c.cat.color), borderRadius: 6, barThickness: 16 }] }}
              options={{ indexAxis: 'y' as const, ...chartOpts(), scales: { x: chartOpts().scales.y, y: { grid: { display: false }, ticks: { color: colors.text } } } }}
            />
          </div>
        </div>
        <div className="surface card">
          <div className="card-title">Reflection — this month</div><div className="card-sub">Your notes for this month</div>
          {reflection && (reflection.worked || reflection.biggestWin || reflection.improvement) ? (
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {reflection.biggestWin && <div style={{ marginBottom: 8 }}><span className="muted">Biggest win — </span>{reflection.biggestWin}</div>}
              {reflection.worked && <div style={{ marginBottom: 8 }}><span className="muted">Worked — </span>{reflection.worked}</div>}
              {reflection.improvement && <div><span className="muted">To improve — </span>{reflection.improvement}</div>}
            </div>
          ) : (
            <>
              <EmptyState icon={PenLine} title="No reflection yet" subtitle="Add a short monthly reflection to track what worked." />
              <a href="/history" className="btn" style={{ width: '100%', justifyContent: 'center' }}>Write reflection</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
