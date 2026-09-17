import Dexie, { Table } from 'dexie';
import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings } from '@/types';

export class HabitOSDatabase extends Dexie {
  habits!: Table<Habit, string>;
  categories!: Table<Category, string>;
  completions!: Table<DailyCompletion, string>;
  monthlyPlans!: Table<MonthlyPlan, string>;
  reflections!: Table<MonthlyReflection, string>;
  settings!: Table<Settings, string>;
  meta!: Table<{ id: string; value: unknown }, string>;

  constructor() {
    super('habitos_db');
    this.version(1).stores({
      habits: 'id, categoryId, active, sortOrder',
      categories: 'id, sortOrder',
      completions: 'id, date, habitId, [date+habitId]',
      monthlyPlans: 'id, year, month, habitId',
      reflections: 'id, year, month',
      settings: 'id',
      meta: 'id',
    });
  }
}

// Lazily instantiated so this file never touches IndexedDB during SSR.
let _db: HabitOSDatabase | null = null;
export function getDB(): HabitOSDatabase {
  if (typeof window === 'undefined') {
    throw new Error('HabitOSDatabase can only be used in the browser');
  }
  if (!_db) _db = new HabitOSDatabase();
  return _db;
}
