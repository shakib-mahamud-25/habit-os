import { Habit, Category, DailyCompletion, MonthlyPlan, HabitPerformance, CategoryPerformance } from '@/types';
import { daysInMonth, iso, todayISO, parseISO } from './dates';
import { buildCompletionIndex, habitStreaks } from './streaks';

export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => h.active);
}

export function goalFor(habit: Habit, year: number, month: number, plans: MonthlyPlan[]): number {
  const override = plans.find((p) => p.year === year && p.month === month && p.habitId === habit.id);
  return override ? override.goal : habit.monthlyGoal;
}

export function monthActualCount(habitId: string, year: number, month: number, index: Map<string, DailyCompletion>): number {
  const dim = daysInMonth(year, month);
  let n = 0;
  for (let d = 1; d <= dim; d++) {
    const rec = index.get(`${iso(year, month, d)}__${habitId}`);
    if (rec && rec.completed) n++;
  }
  return n;
}

export function monthCompletionSeries(
  year: number, month: number, habits: Habit[], index: Map<string, DailyCompletion>
): (number | null)[] {
  const dim = daysInMonth(year, month);
  const active = activeHabits(habits);
  const today = todayISO();
  const series: (number | null)[] = [];
  for (let d = 1; d <= dim; d++) {
    const ds = iso(year, month, d);
    if (ds > today) { series.push(null); continue; }
    let done = 0, total = 0;
    for (const h of active) {
      if (h.createdAt > parseISO(ds).getTime() + 86400000) continue;
      total++;
      const rec = index.get(`${ds}__${h.id}`);
      if (rec && rec.completed) done++;
    }
    series.push(total ? Math.round((done / total) * 100) : 0);
  }
  return series;
}

export interface MonthStats {
  completed: number; scheduled: number; remaining: number; pct: number; perfectDays: number; countedDays: number;
}

export function monthStats(year: number, month: number, habits: Habit[], index: Map<string, DailyCompletion>): MonthStats {
  const dim = daysInMonth(year, month);
  const active = activeHabits(habits);
  const today = todayISO();
  let completed = 0, scheduled = 0, perfectDays = 0, countedDays = 0;
  for (let d = 1; d <= dim; d++) {
    const ds = iso(year, month, d);
    if (ds > today) continue;
    let dayDone = 0, dayTotal = 0;
    for (const h of active) {
      if (h.createdAt > parseISO(ds).getTime() + 86400000) continue;
      dayTotal++; scheduled++;
      const rec = index.get(`${ds}__${h.id}`);
      if (rec && rec.completed) { dayDone++; completed++; }
    }
    if (dayTotal > 0) { countedDays++; if (dayDone === dayTotal) perfectDays++; }
  }
  const pct = scheduled ? Math.round((completed / scheduled) * 100) : 0;
  return { completed, scheduled, remaining: Math.max(scheduled - completed, 0), pct, perfectDays, countedDays };
}

export function habitPerformance(
  year: number, month: number, habits: Habit[], completions: DailyCompletion[], plans: MonthlyPlan[]
): HabitPerformance[] {
  const index = buildCompletionIndex(completions);
  return activeHabits(habits)
    .map((h) => {
      const actual = monthActualCount(h.id, year, month, index);
      const goal = goalFor(h, year, month, plans) || 1;
      const pct = Math.min(100, Math.round((actual / goal) * 100));
      const streak = habitStreaks(h.id, completions);
      return { habit: h, actual, goal, pct, remaining: Math.max(goal - actual, 0), streak };
    })
    .sort((a, b) => b.pct - a.pct);
}

export function categoryPerformance(
  year: number, month: number, habits: Habit[], categories: Category[], completions: DailyCompletion[], plans: MonthlyPlan[]
): CategoryPerformance[] {
  const index = buildCompletionIndex(completions);
  const map = new Map<string, { cat: Category; actual: number; goal: number }>();
  for (const h of activeHabits(habits)) {
    const cat = categories.find((c) => c.id === h.categoryId);
    if (!cat) continue;
    const actual = monthActualCount(h.id, year, month, index);
    const goal = goalFor(h, year, month, plans) || 1;
    if (!map.has(cat.id)) map.set(cat.id, { cat, actual: 0, goal: 0 });
    const e = map.get(cat.id)!;
    e.actual += actual; e.goal += goal;
  }
  return [...map.values()].map((e) => ({ ...e, pct: e.goal ? Math.min(100, Math.round((e.actual / e.goal) * 100)) : 0 }));
}

export function weeklyPerformance(year: number, month: number, habits: Habit[], completions: DailyCompletion[]) {
  const index = buildCompletionIndex(completions);
  const dim = daysInMonth(year, month);
  const today = todayISO();
  const active = activeHabits(habits);
  const weeks: { done: number; total: number }[] = [];
  let wk = { done: 0, total: 0 };
  for (let d = 1; d <= dim; d++) {
    const ds = iso(year, month, d);
    const dow = new Date(year, month, d).getDay();
    if (ds <= today) {
      for (const h of active) {
        if (h.createdAt > parseISO(ds).getTime() + 86400000) continue;
        wk.total++;
        const rec = index.get(`${ds}__${h.id}`);
        if (rec && rec.completed) wk.done++;
      }
    }
    if (dow === 6 || d === dim) { weeks.push(wk); wk = { done: 0, total: 0 }; }
  }
  return weeks.map((w, i) => ({ label: 'Week ' + (i + 1), pct: w.total ? Math.round((w.done / w.total) * 100) : 0 }));
}

export function dayOfWeekConsistency(completions: DailyCompletion[]) {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const c of completions) {
    const dow = parseISO(c.date).getDay();
    totals[dow]++;
    if (c.completed) buckets[dow]++;
  }
  return buckets.map((b, i) => (totals[i] ? Math.round((b / totals[i]) * 100) : 0));
}
