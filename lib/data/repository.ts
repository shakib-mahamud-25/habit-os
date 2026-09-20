import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';

/**
 * DataRepository is the single seam between the UI and storage.
 * FirebaseRepository (Firestore) is the active implementation today, for
 * real-time cross-device sync. LocalRepository (IndexedDB via Dexie) still
 * implements the same interface and is kept in the codebase for reference /
 * a possible future offline-only mode.
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

  /** Optional: repositories scoped to a signed-in user (Firestore) need to
   *  be told who that is. Local, single-device repositories can omit this. */
  setUser?(uid: string | null): void;

  /** Optional: repositories backed by a live database can implement this
   *  for real-time sync -- fires immediately with current data, then again
   *  on every change, from this tab, another tab, or another device signed
   *  into the same account. Returns an unsubscribe function. Repositories
   *  without live push (plain IndexedDB) can omit it; callers fall back to
   *  a one-time loadAll(). */
  subscribeAll?(
    onChange: (data: {
      habits: Habit[];
      categories: Category[];
      completions: DailyCompletion[];
      monthlyPlans: MonthlyPlan[];
      reflections: MonthlyReflection[];
      settings: Settings;
    }) => void,
    onError?: (err: unknown) => void
  ): () => void;
}
