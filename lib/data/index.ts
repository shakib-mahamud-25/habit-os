import { DataRepository } from './repository';
import { FirebaseRepository } from './firebase-repository';

// Now backed by Firestore for real-time cross-tab/cross-device sync.
// LocalRepository (lib/data/local-repository.ts) still implements the same
// interface and is kept in the codebase for reference / a possible future
// offline-only mode, but isn't the active repository.
export const repository: DataRepository = new FirebaseRepository();
export type { DataRepository } from './repository';
