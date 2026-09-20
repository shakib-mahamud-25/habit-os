'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  const uid = user?.uid ?? null;

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

  // AuthGate guarantees `uid` is set by the time this provider's children
  // render (it shows the login screen otherwise), so this effect only ever
  // runs for a signed-in user -- but it still guards on `uid` in case that
  // ever changes (e.g. sign-out from another tab).
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    setLoading(true);
    setError(null);
    repository.setUser?.(uid);

    (async () => {
      try {
        await repository.seedIfEmpty();
        if (cancelled) return;

        if (repository.subscribeAll) {
          // Real-time: fires immediately with current data, then again on
          // every change -- this tab, another tab, or another device signed
          // into this same account. This is the actual fix for data not
          // being in sync across pages/devices.
          unsubscribe = repository.subscribeAll(
            (data) => {
              if (cancelled) return;
              setHabits(data.habits);
              setCategories(data.categories);
              setCompletions(data.completions);
              setMonthlyPlans(data.monthlyPlans);
              setReflections(data.reflections);
              setSettings(data.settings);
              setLoading(false);
            },
            (err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Sync error.'); }
          );
        } else {
          const data = await repository.loadAll();
          if (cancelled) return;
          setHabits(data.habits); setCategories(data.categories); setCompletions(data.completions);
          setMonthlyPlans(data.monthlyPlans); setReflections(data.reflections); setSettings(data.settings);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load data.'); setLoading(false); }
      }
    })();

    return () => { cancelled = true; unsubscribe?.(); };
  }, [uid]);

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

  // None of the actions below patch local state themselves anymore -- the
  // live subscription above is the single source of truth, and Firestore's
  // local cache makes it update within milliseconds (before the write even
  // reaches the server), so this stays instant without two code paths that
  // could ever disagree with each other.
  const toggleCompletion = useCallback(async (date: string, habitId: string) => {
    await repository.toggleCompletion(date, habitId);
  }, []);

  const saveHabitFn = useCallback(async (habit: Habit) => {
    const toSave: Habit = { ...habit, updatedAt: Date.now() };
    if (!toSave.createdAt) toSave.createdAt = Date.now();
    if (!toSave.id) toSave.id = `habit_${Math.random().toString(36).slice(2, 10)}`;
    if (toSave.sortOrder === undefined) toSave.sortOrder = habits.length;
    await repository.saveHabit(toSave);
  }, [habits.length]);

  const setHabitActive = useCallback(async (id: string, active: boolean) => {
    const h = habits.find((x) => x.id === id);
    if (!h) return;
    await repository.saveHabit({ ...h, active, updatedAt: Date.now() });
  }, [habits]);

  const deleteHabit = useCallback(async (id: string) => {
    await repository.deleteHabit(id);
  }, []);

  const saveCategory = useCallback(async (category: Category) => {
    const toSave = { ...category };
    if (!toSave.id) toSave.id = `cat_${Math.random().toString(36).slice(2, 10)}`;
    if (toSave.sortOrder === undefined) toSave.sortOrder = categories.length;
    await repository.saveCategory(toSave);
  }, [categories.length]);

  const saveReflectionFn = useCallback(async (year: number, month: number, data: Partial<MonthlyReflection>) => {
    const id = `${year}-${String(month + 1).padStart(2, '0')}`;
    const rec: MonthlyReflection = {
      id, year, month, worked: '', didNotWork: '', biggestWin: '', improvement: '', notes: '',
      ...data, updatedAt: Date.now(),
    };
    await repository.saveReflection(rec);
  }, []);

  const saveSettingsFn = useCallback(async (patch: Partial<Settings>) => {
    await repository.saveSettings({ ...settings, ...patch, id: 'app' });
  }, [settings]);

  const saveMonthlyGoalOverride = useCallback(async (year: number, month: number, habitId: string, goal: number) => {
    const id = `${year}-${String(month + 1).padStart(2, '0')}_${habitId}`;
    await repository.saveMonthlyPlan({ id, year, month, habitId, goal });
  }, []);

  const resetAll = useCallback(async () => { await repository.resetAll(); }, []);
  const importBackup = useCallback(async (payload: BackupPayload, mode: 'merge' | 'replace') => {
    await repository.importBackup(payload, mode);
  }, []);

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
