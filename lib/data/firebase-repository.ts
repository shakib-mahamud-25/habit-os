import {
  collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, writeBatch, runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DataRepository } from './repository';
import { DEFAULT_CATEGORIES, buildSeedHabits } from './seed';
import { Habit, Category, DailyCompletion, MonthlyPlan, MonthlyReflection, Settings, BackupPayload } from '@/types';

const DEFAULT_SETTINGS: Settings = { id: 'app', theme: 'system', weekStart: 'monday', overallStreakMode: 'all' };

interface LoadedData {
  habits: Habit[]; categories: Category[]; completions: DailyCompletion[];
  monthlyPlans: MonthlyPlan[]; reflections: MonthlyReflection[]; settings: Settings;
}

const WRITE_CHUNK = 400; // Firestore batches cap at 500 writes; chunk defensively.

/**
 * Firestore-backed implementation of DataRepository. Every document lives
 * under users/{uid}/<collection>/<id> -- see firestore.rules for the access
 * rule that keeps each user's subtree private to them.
 */
export class FirebaseRepository implements DataRepository {
  private uid: string | null = null;

  setUser(uid: string | null) {
    this.uid = uid;
  }

  private requireUid(): string {
    if (!this.uid) throw new Error('FirebaseRepository used before a signed-in user was set');
    return this.uid;
  }

  private col(name: string) {
    return collection(db, 'users', this.requireUid(), name);
  }

  private settingsDocRef() {
    return doc(db, 'users', this.requireUid(), 'settings', 'app');
  }

  private seededMarkerRef() {
    return doc(db, 'users', this.requireUid(), 'meta', 'seeded');
  }

  async loadAll(): Promise<LoadedData> {
    const [habitsSnap, categoriesSnap, completionsSnap, plansSnap, reflectionsSnap, settingsSnap] = await Promise.all([
      getDocs(this.col('habits')),
      getDocs(this.col('categories')),
      getDocs(this.col('completions')),
      getDocs(this.col('monthlyPlans')),
      getDocs(this.col('reflections')),
      getDocs(this.col('settings')),
    ]);
    const settingsDoc = settingsSnap.docs.find((d) => d.id === 'app');
    return {
      habits: habitsSnap.docs.map((d) => d.data() as Habit).sort((a, b) => a.sortOrder - b.sortOrder),
      categories: categoriesSnap.docs.map((d) => d.data() as Category).sort((a, b) => a.sortOrder - b.sortOrder),
      completions: completionsSnap.docs.map((d) => d.data() as DailyCompletion),
      monthlyPlans: plansSnap.docs.map((d) => d.data() as MonthlyPlan),
      reflections: reflectionsSnap.docs.map((d) => d.data() as MonthlyReflection),
      settings: settingsDoc ? (settingsDoc.data() as Settings) : DEFAULT_SETTINGS,
    };
  }

  subscribeAll(onChange: (data: LoadedData) => void, onError?: (err: unknown) => void): () => void {
    const cache: LoadedData = {
      habits: [], categories: [], completions: [], monthlyPlans: [], reflections: [], settings: DEFAULT_SETTINGS,
    };
    const emit = () => onChange({
      ...cache,
      habits: [...cache.habits].sort((a, b) => a.sortOrder - b.sortOrder),
      categories: [...cache.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    });
    const handleErr = (err: unknown) => onError?.(err);

    const unsubs = [
      onSnapshot(this.col('habits'), (snap) => { cache.habits = snap.docs.map((d) => d.data() as Habit); emit(); }, handleErr),
      onSnapshot(this.col('categories'), (snap) => { cache.categories = snap.docs.map((d) => d.data() as Category); emit(); }, handleErr),
      onSnapshot(this.col('completions'), (snap) => { cache.completions = snap.docs.map((d) => d.data() as DailyCompletion); emit(); }, handleErr),
      onSnapshot(this.col('monthlyPlans'), (snap) => { cache.monthlyPlans = snap.docs.map((d) => d.data() as MonthlyPlan); emit(); }, handleErr),
      onSnapshot(this.col('reflections'), (snap) => { cache.reflections = snap.docs.map((d) => d.data() as MonthlyReflection); emit(); }, handleErr),
      onSnapshot(this.settingsDocRef(), (snap) => { cache.settings = snap.exists() ? (snap.data() as Settings) : DEFAULT_SETTINGS; emit(); }, handleErr),
    ];
    return () => unsubs.forEach((u) => u());
  }

  async seedIfEmpty() {
    const metaSnap = await getDocs(collection(db, 'users', this.requireUid(), 'meta'));
    if (metaSnap.docs.some((d) => d.id === 'seeded')) return;
    const now = Date.now();
    const batch = writeBatch(db);
    for (const c of DEFAULT_CATEGORIES) batch.set(doc(this.col('categories'), c.id), c);
    for (const h of buildSeedHabits(now)) batch.set(doc(this.col('habits'), h.id), h);
    batch.set(this.settingsDocRef(), DEFAULT_SETTINGS);
    batch.set(this.seededMarkerRef(), { seededAt: now });
    await batch.commit();
  }

  async saveHabit(habit: Habit) {
    await setDoc(doc(this.col('habits'), habit.id), habit);
  }

  async deleteHabit(id: string) {
    await deleteDoc(doc(this.col('habits'), id));
  }

  async saveCategory(category: Category) {
    await setDoc(doc(this.col('categories'), category.id), category);
  }

  async toggleCompletion(date: string, habitId: string): Promise<DailyCompletion> {
    const id = `${date}__${habitId}`;
    const ref = doc(this.col('completions'), id);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const rec: DailyCompletion = snap.exists()
        ? { ...(snap.data() as DailyCompletion), completed: !(snap.data() as DailyCompletion).completed, updatedAt: now }
        : { id, date, habitId, completed: true, createdAt: now, updatedAt: now };
      tx.set(ref, rec);
      return rec;
    });
  }

  async saveMonthlyPlan(plan: MonthlyPlan) {
    await setDoc(doc(this.col('monthlyPlans'), plan.id), plan);
  }

  async saveReflection(reflection: MonthlyReflection) {
    await setDoc(doc(this.col('reflections'), reflection.id), reflection);
  }

  async saveSettings(settings: Settings) {
    await setDoc(this.settingsDocRef(), settings);
  }

  private async clearCollection(name: string) {
    const snap = await getDocs(this.col(name));
    for (let i = 0; i < snap.docs.length; i += WRITE_CHUNK) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + WRITE_CHUNK).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  async resetAll() {
    await Promise.all(['habits', 'categories', 'completions', 'monthlyPlans', 'reflections'].map((n) => this.clearCollection(n)));
    await deleteDoc(this.seededMarkerRef()).catch(() => {});
    await this.seedIfEmpty();
  }

  async importBackup(payload: BackupPayload, mode: 'merge' | 'replace') {
    if (mode === 'replace') {
      await Promise.all(['habits', 'categories', 'completions', 'monthlyPlans', 'reflections'].map((n) => this.clearCollection(n)));
    }
    const groups: Array<[string, Array<{ id: string }>]> = [
      ['categories', payload.categories || []],
      ['habits', payload.habits || []],
      ['completions', payload.completions || []],
      ['monthlyPlans', payload.monthlyPlans || []],
      ['reflections', payload.reflections || []],
    ];
    for (const [name, items] of groups) {
      for (let i = 0; i < items.length; i += WRITE_CHUNK) {
        const batch = writeBatch(db);
        items.slice(i, i + WRITE_CHUNK).forEach((item) => batch.set(doc(this.col(name), item.id), item));
        await batch.commit();
      }
    }
    if (payload.settings) await setDoc(this.settingsDocRef(), payload.settings);
  }
}
