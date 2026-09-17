export interface Habit {
  id: string;
  name: string;
  categoryId: string;
  monthlyGoal: number;
  active: boolean;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface DailyCompletion {
  id: string; // `${date}__${habitId}`
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyPlan {
  id: string; // `${year}-${month+1}_${habitId}`
  year: number;
  month: number; // 0-indexed
  habitId: string;
  goal: number;
}

export interface MonthlyReflection {
  id: string; // `${year}-${month+1}`
  year: number;
  month: number;
  worked: string;
  didNotWork: string;
  biggestWin: string;
  improvement: string;
  notes: string;
  updatedAt: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type WeekStart = 'monday' | 'sunday';

export interface Settings {
  id: 'app';
  theme: ThemeMode;
  weekStart: WeekStart;
  overallStreakMode: 'all';
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  habits: Habit[];
  categories: Category[];
  completions: DailyCompletion[];
  monthlyPlans: MonthlyPlan[];
  reflections: MonthlyReflection[];
  settings: Settings;
}

export interface HabitPerformance {
  habit: Habit;
  actual: number;
  goal: number;
  pct: number;
  remaining: number;
  streak: { current: number; best: number };
}

export interface CategoryPerformance {
  cat: Category;
  actual: number;
  goal: number;
  pct: number;
}
