'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository } from '@/lib/data';
import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';
import { buildCompletionIndex } from '@/lib/streaks';

interface AppDataState {
  loading: boolean;
  error: string | null;
  habits: Habit[];
  categories: Category[];
  completions: DailyCompletion[];
  monthlyPlans: MonthlyPlan[];
  reflections: MonthlyReflection[];
  settings: Settings;
  completionIndex: Map<string, DailyCompletion>;
  activeMonth: { year: number; month: number };
  setActiveMonth: (v: { year: number; month: number }) => void;
  shiftMonth: (delta: number) => void;

  toggleCompletion: (date: string, habitId: string) => Promise<void>;
  saveHabit: (habit: Habit) => Promise<void>;
  setHabitActive: (id: string, active: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  saveReflection: (year: number, month: number, data: Partial<MonthlyReflection>) => Promise<void>;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  saveMonthlyGoalOverride: (year: number, month: number, habitId: string, goal: number) => Promise<void>;
  resetAll: () => Promise<void>;
  importBackup: (payload: BackupPayload, mode: 'merge' | 'replace') => Promise<void>;
}

const AppDataContext = createContext<AppDataState | null>(null);

const FALLBACK_SETTINGS: Settings = { id: 'app', theme: 'system', weekStart: 'monday', overallStreakMode: 'all' };

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completions, setCompletions] = useState<DailyCompletion[]>([]);
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  const [settings, setSettings] = useState<Settings>(FALLBACK_SETTINGS);
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const refresh = useCallback(async () => {
    const data = await repository.loadAll();
    setHabits(data.habits);
    setCategories(data.categories);
    setCompletions(data.completions);
    setMonthlyPlans(data.monthlyPlans);
    setReflections(data.reflections);
    setSettings(data.settings);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await repository.seedIfEmpty();
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load local data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  const completionIndex = useMemo(() => buildCompletionIndex(completions), [completions]);

  const shiftMonth = useCallback((delta: number) => {
    setActiveMonth((prev) => {
      let { year, month } = prev;
      month += delta;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });
  }, []);

  const toggleCompletion = useCallback(async (date: string, habitId: string) => {
    const rec = await repository.toggleCompletion(date, habitId);
    setCompletions((prev) => {
      const i = prev.findIndex((c) => c.id === rec.id);
      if (i >= 0) { const next = [...prev]; next[i] = rec; return next; }
      return [...prev, rec];
    });
  }, []);

  const saveHabitFn = useCallback(async (habit: Habit) => {
    const toSave: Habit = { ...habit, updatedAt: Date.now() };
    if (!toSave.createdAt) toSave.createdAt = Date.now();
    await repository.saveHabit(toSave);
    setHabits((prev) => {
      const i = prev.findIndex((h) => h.id === toSave.id);
      const next = i >= 0 ? prev.map((h) => (h.id === toSave.id ? toSave : h)) : [...prev, toSave];
      return next.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  }, []);

  const setHabitActive = useCallback(async (id: string, active: boolean) => {
    setHabits((prev) => {
      const h = prev.find((x) => x.id === id);
      if (!h) return prev;
      const updated = { ...h, active, updatedAt: Date.now() };
      repository.saveHabit(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    await repository.deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const saveCategory = useCallback(async (category: Category) => {
    const toSave = { ...category };
    if (!toSave.id) toSave.id = `cat_${Math.random().toString(36).slice(2, 10)}`;
    if (toSave.sortOrder === undefined) toSave.sortOrder = categories.length;
    await repository.saveCategory(toSave);
    setCategories((prev) => {
      const i = prev.findIndex((c) => c.id === toSave.id);
      return i >= 0 ? prev.map((c) => (c.id === toSave.id ? toSave : c)) : [...prev, toSave];
    });
  }, [categories.length]);

  const saveReflectionFn = useCallback(async (year: number, month: number, data: Partial<MonthlyReflection>) => {
    const id = `${year}-${String(month + 1).padStart(2, '0')}`;
    const rec: MonthlyReflection = {
      id, year, month, worked: '', didNotWork: '', biggestWin: '', improvement: '', notes: '',
      ...data, updatedAt: Date.now(),
    };
    await repository.saveReflection(rec);
    setReflections((prev) => {
      const i = prev.findIndex((r) => r.id === id);
      return i >= 0 ? prev.map((r) => (r.id === id ? rec : r)) : [...prev, rec];
    });
  }, []);

  const saveSettingsFn = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch, id: 'app' as const };
    await repository.saveSettings(next);
    setSettings(next);
  }, [settings]);

  const saveMonthlyGoalOverride = useCallback(async (year: number, month: number, habitId: string, goal: number) => {
    const id = `${year}-${String(month + 1).padStart(2, '0')}_${habitId}`;
    const rec: MonthlyPlan = { id, year, month, habitId, goal };
    await repository.saveMonthlyPlan(rec);
    setMonthlyPlans((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      return i >= 0 ? prev.map((p) => (p.id === id ? rec : p)) : [...prev, rec];
    });
  }, []);

  const resetAll = useCallback(async () => {
    await repository.resetAll();
    await refresh();
  }, [refresh]);

  const importBackup = useCallback(async (payload: BackupPayload, mode: 'merge' | 'replace') => {
    await repository.importBackup(payload, mode);
    await refresh();
  }, [refresh]);

  const value: AppDataState = {
    loading, error, habits, categories, completions, monthlyPlans, reflections, settings, completionIndex,
    activeMonth, setActiveMonth, shiftMonth,
    toggleCompletion, saveHabit: saveHabitFn, setHabitActive, deleteHabit, saveCategory,
    saveReflection: saveReflectionFn, saveSettings: saveSettingsFn, saveMonthlyGoalOverride,
    resetAll, importBackup,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataState {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
