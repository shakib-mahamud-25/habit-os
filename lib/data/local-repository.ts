import { getDB } from './db';
import { DataRepository } from './repository';
import { DEFAULT_CATEGORIES, buildSeedHabits } from './seed';
import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';

const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  theme: 'system',
  weekStart: 'monday',
  overallStreakMode: 'all',
};

export class LocalRepository implements DataRepository {
  async loadAll() {
    const db = getDB();
    const [habits, categories, completions, monthlyPlans, reflections, settingsRows] = await Promise.all([
      db.habits.toArray(),
      db.categories.toArray(),
      db.completions.toArray(),
      db.monthlyPlans.toArray(),
      db.reflections.toArray(),
      db.settings.toArray(),
    ]);
    return {
      habits: habits.sort((a, b) => a.sortOrder - b.sortOrder),
      categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
      completions,
      monthlyPlans,
      reflections,
      settings: settingsRows.find((s) => s.id === 'app') || DEFAULT_SETTINGS,
    };
  }

  async seedIfEmpty() {
    const db = getDB();
    const seeded = await db.meta.get('seeded');
    if (seeded) return;
    const now = Date.now();
    await db.transaction('rw', db.categories, db.habits, db.settings, db.meta, async () => {
      await db.categories.bulkPut(DEFAULT_CATEGORIES);
      await db.habits.bulkPut(buildSeedHabits(now));
      await db.settings.put(DEFAULT_SETTINGS);
      await db.meta.put({ id: 'seeded', value: now });
    });
  }

  async saveHabit(habit: Habit) {
    await getDB().habits.put(habit);
  }

  async deleteHabit(id: string) {
    // Soft-delete is preferred from the UI (setHabitActive). This is a hard
    // delete used only after explicit user confirmation. Completion history
    // is intentionally left untouched for data integrity.
    await getDB().habits.delete(id);
  }

  async saveCategory(category: Category) {
    await getDB().categories.put(category);
  }

  async toggleCompletion(date: string, habitId: string) {
    const db = getDB();
    const id = `${date}__${habitId}`;
    const now = Date.now();
    const existing = await db.completions.get(id);
    const rec: DailyCompletion = existing
      ? { ...existing, completed: !existing.completed, updatedAt: now }
      : { id, date, habitId, completed: true, createdAt: now, updatedAt: now };
    await db.completions.put(rec);
    return rec;
  }

  async saveMonthlyPlan(plan: MonthlyPlan) {
    await getDB().monthlyPlans.put(plan);
  }

  async saveReflection(reflection: MonthlyReflection) {
    await getDB().reflections.put(reflection);
  }

  async saveSettings(settings: Settings) {
    await getDB().settings.put(settings);
  }

  async resetAll() {
    const db = getDB();
    await db.transaction('rw', db.habits, db.categories, db.completions, db.monthlyPlans, db.reflections, db.meta, async () => {
      await Promise.all([
        db.habits.clear(),
        db.categories.clear(),
        db.completions.clear(),
        db.monthlyPlans.clear(),
        db.reflections.clear(),
        db.meta.clear(),
      ]);
    });
    await this.seedIfEmpty();
  }

  async importBackup(payload: BackupPayload, mode: 'merge' | 'replace') {
    const db = getDB();
    await db.transaction('rw', db.habits, db.categories, db.completions, db.monthlyPlans, db.reflections, db.settings, async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.habits.clear(),
          db.categories.clear(),
          db.completions.clear(),
          db.monthlyPlans.clear(),
          db.reflections.clear(),
        ]);
      }
      await db.categories.bulkPut(payload.categories || []);
      await db.habits.bulkPut(payload.habits || []);
      await db.completions.bulkPut(payload.completions || []);
      await db.monthlyPlans.bulkPut(payload.monthlyPlans || []);
      await db.reflections.bulkPut(payload.reflections || []);
      if (payload.settings) await db.settings.put(payload.settings);
    });
  }
}
