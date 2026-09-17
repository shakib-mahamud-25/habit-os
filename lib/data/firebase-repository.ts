import { DataRepository } from './repository';

/**
 * Placeholder for future cloud sync. Implementing this class with the
 * Firebase SDK (Firestore for data, Firebase Auth for accounts) and
 * swapping it in at lib/data/index.ts is the only change needed to add
 * multi-device sync — no UI or component code depends on IndexedDB directly.
 *
 * Intentionally unimplemented in v1: the product must work fully with
 * zero account and zero network requirement out of the box.
 */
export class FirebaseRepository implements DataRepository {
  private notReady(): never {
    throw new Error(
      'FirebaseRepository is not implemented yet. Add your Firebase config, ' +
      'implement each method against Firestore, then switch the export in lib/data/index.ts.'
    );
  }
  loadAll(): ReturnType<DataRepository['loadAll']> { return this.notReady(); }
  seedIfEmpty(): ReturnType<DataRepository['seedIfEmpty']> { return this.notReady(); }
  saveHabit(): ReturnType<DataRepository['saveHabit']> { return this.notReady(); }
  deleteHabit(): ReturnType<DataRepository['deleteHabit']> { return this.notReady(); }
  saveCategory(): ReturnType<DataRepository['saveCategory']> { return this.notReady(); }
  toggleCompletion(): ReturnType<DataRepository['toggleCompletion']> { return this.notReady(); }
  saveMonthlyPlan(): ReturnType<DataRepository['saveMonthlyPlan']> { return this.notReady(); }
  saveReflection(): ReturnType<DataRepository['saveReflection']> { return this.notReady(); }
  saveSettings(): ReturnType<DataRepository['saveSettings']> { return this.notReady(); }
  resetAll(): ReturnType<DataRepository['resetAll']> { return this.notReady(); }
  importBackup(): ReturnType<DataRepository['importBackup']> { return this.notReady(); }
}
