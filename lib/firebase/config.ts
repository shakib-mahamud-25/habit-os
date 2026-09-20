import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
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

if (typeof window !== 'undefined') {
  // One-time boot diagnostic: confirms whether the NEXT_PUBLIC_FIREBASE_*
  // env vars actually made it into this deployed build. If authDomain or
  // projectId print as "undefined" here, the env vars weren't set at
  // build time -- re-check Vercel's Environment Variables and redeploy.
  console.log('[HabitOS Firebase] config in this build ->', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}…` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
  });
  // Surface the exact origin the browser is actually running on, since
  // "auth/unauthorized-domain" depends on this matching an entry in
  // Firebase Console -> Authentication -> Settings -> Authorized domains
  // EXACTLY (no protocol, no trailing slash, no path).
  console.log('[HabitOS Firebase] current origin (must be in Authorized Domains) ->', window.location.hostname);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Force account chooser every time instead of silently reusing whatever
// Google session is cached in the browser -- avoids a class of "signs in
// as the wrong account" / "seems to do nothing" reports.
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined') {
  // Explicit local persistence (survives tab close, required for the
  // redirect flow to work at all -- signInWithRedirect leaves the page
  // entirely, so whatever remembers "a sign-in is in progress" has to be
  // durable, not memory-only). This is Firebase's default, but setting it
  // explicitly removes any doubt and logs failures instead of failing silently.
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('[HabitOS Firebase] setPersistence FAILED (falling back to default):', err);
  });
}

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
