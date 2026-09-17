import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';

/**
 * DataRepository is the single seam between the UI and storage.
 * LocalRepository (IndexedDB via Dexie) implements this today.
 * A future FirebaseRepository can implement the same interface for
 * cloud sync/multi-device support without touching any component.
 */
export interface DataRepository {
  loadAll(): Promise<{
    habits: Habit[];
    categories: Category[];
    completions: DailyCompletion[];
    monthlyPlans: MonthlyPlan[];
    reflections: MonthlyReflection[];
    settings: Settings;
  }>;

  seedIfEmpty(): Promise<void>;

  saveHabit(habit: Habit): Promise<void>;
  deleteHabit(id: string): Promise<void>;

  saveCategory(category: Category): Promise<void>;

  toggleCompletion(date: string, habitId: string): Promise<DailyCompletion>;

  saveMonthlyPlan(plan: MonthlyPlan): Promise<void>;

  saveReflection(reflection: MonthlyReflection): Promise<void>;

  saveSettings(settings: Settings): Promise<void>;

  resetAll(): Promise<void>;

  importBackup(payload: BackupPayload, mode: 'merge' | 'replace'): Promise<void>;
}
