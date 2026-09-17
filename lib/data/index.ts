import { DataRepository } from './repository';
import { LocalRepository } from './local-repository';

// Swap this line for `new FirebaseRepository()` once cloud sync is implemented.
// Nothing else in the app needs to change — every component talks to
// `repository`, never to Dexie or Firebase directly.
export const repository: DataRepository = new LocalRepository();
export type { DataRepository } from './repository';
