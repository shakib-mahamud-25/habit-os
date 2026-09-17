import { DailyCompletion, Habit } from '@/types';
import { addDaysISO, todayISO } from './dates';

/**
 * Consecutive-day streak calculation for a single habit, across all
 * history (not bounded to any one month) — correctly crosses month
 * and year boundaries because it walks real calendar dates.
 */
export function habitStreaks(habitId: string, completions: DailyCompletion[]): { current: number; best: number } {
  const dates = completions
    .filter((c) => c.habitId === habitId && c.completed)
    .map((c) => c.date)
    .sort();
  if (dates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (addDaysISO(dates[i - 1], 1) === dates[i]) run++;
    else run = 1;
    if (run > best) best = run;
  }

  const set = new Set(dates);
  let current = 0;
  let cursor = todayISO();
  if (!set.has(cursor)) cursor = addDaysISO(cursor, -1); // today not done yet is OK; streak can still be "current" through yesterday
  while (set.has(cursor)) {
    current++;
    cursor = addDaysISO(cursor, -1);
  }
  return { current, best };
}

function isDoneOn(date: string, habitId: string, index: Map<string, DailyCompletion>): boolean {
  const rec = index.get(`${date}__${habitId}`);
  return !!(rec && rec.completed);
}

export function buildCompletionIndex(completions: DailyCompletion[]): Map<string, DailyCompletion> {
  const m = new Map<string, DailyCompletion>();
  for (const c of completions) m.set(`${c.date}__${c.habitId}`, c);
  return m;
}

/** A day counts toward the overall streak when every active habit that
 *  existed by that day was completed. */
function overallDayComplete(dateStr: string, activeHabits: Habit[], index: Map<string, DailyCompletion>): boolean {
  const cutoff = new Date(dateStr).getTime() + 86400000;
  const scheduled = activeHabits.filter((h) => h.createdAt <= cutoff);
  if (scheduled.length === 0) return false;
  return scheduled.every((h) => isDoneOn(dateStr, h.id, index));
}

export function overallStreak(activeHabits: Habit[], completions: DailyCompletion[]): number {
  const index = buildCompletionIndex(completions);
  let current = 0;
  let cursor = todayISO();
  if (!overallDayComplete(cursor, activeHabits, index)) cursor = addDaysISO(cursor, -1);
  let guard = 0;
  while (overallDayComplete(cursor, activeHabits, index) && guard < 3650) {
    current++;
    cursor = addDaysISO(cursor, -1);
    guard++;
  }
  return current;
}
