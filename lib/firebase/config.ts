import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  getFirestore, Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// These NEXT_PUBLIC_ values are not secret -- Firebase's web config is meant
// to be visible in client bundles. The real access boundary is Firestore
// Security Rules (see firestore.rules) plus the Authorized Domains list in
// Firebase Auth settings, not hiding this object.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Persistent local cache + multi-tab coordination. This is what makes
// Firestore's real-time listeners stay in sync across browser tabs on the
// same device (fixing "some days updated, some didn't" when two tabs are
// open), on top of syncing across devices via the server.
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  // Falls back to a plain instance if this is a second init in the same
  // session (e.g. React Fast Refresh in dev) or the persistent-cache API
  // isn't available in this SDK version.
  _db = getFirestore(app);
}
export const db = _db;
