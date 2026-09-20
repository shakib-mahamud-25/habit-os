# Firebase Setup Guide — Habit OS

This wires up Google Sign-In + real-time Firestore sync. Everything here
stays on Firebase's free **Spark** plan — no Cloud Functions, no billing
account needed, for this scope (auth + Firestore only).

---

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project**.
2. Name it (e.g. `habit-os`). Google Analytics for Firebase is optional —
   skip it, it's unrelated to the `NEXT_PUBLIC_GA_MEASUREMENT_ID` analytics
   already in this app.
3. Wait for project creation to finish.

## 2. Register a Web App (this is where your config values come from)

1. On the project's Overview page, click the **`</>`** (Web) icon.
2. Nickname it anything (e.g. "Habit OS Web"). Leave "Firebase Hosting"
   **unchecked** — you're deploying on Vercel, not Firebase Hosting.
3. Click **Register app**. You'll see a `firebaseConfig` object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "habit-os-xxxxx.firebaseapp.com",
     projectId: "habit-os-xxxxx",
     storageBucket: "habit-os-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456",
   };
   ```
   **Keep this tab open** — you'll copy these 6 values into env vars in step 6.

## 3. Enable Google Sign-In

1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → click **Google** → toggle **Enable**.
3. Pick a support email (required) → **Save**.

## 4. Add your domains to Authorized Domains

Still in Authentication → **Settings** tab → **Authorized domains**.
`localhost` is there by default (for local dev). **Add your Vercel domain**
here too (e.g. `habit-track-os.vercel.app`, and later any custom domain) —
**sign-in will fail with an `auth/unauthorized-domain` error if you skip
this**, since `signInWithRedirect` checks against this list.

## 5. Create the Firestore database

1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Choose **Start in production mode** (not test mode — production mode
   respects the rules file below from the start; test mode is wide open
   and expires in 30 days).
3. Pick a location close to your users. **This cannot be changed later**
   without recreating the database, so choose deliberately.

## 6. Publish the security rules

1. Firestore Database → **Rules** tab.
2. Replace the default contents with everything in this project's
   `firestore.rules` file (also shown below) → **Publish**.

   ```
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
   This is the entire access model: a signed-in user can only ever read or
   write their own `users/{their-uid}/...` subtree. No one can read anyone
   else's habits, ever — including a future leaderboard, which is exactly
   why that'll need its own separate, deliberately-public collection later
   rather than reading this one.

## 7. Add the environment variables

Copy `.env.local.example` to `.env.local` and fill in the 6 values from
step 2:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=habit-os-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=habit-os-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=habit-os-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**In Vercel:** Project → Settings → Environment Variables → add all 6 the
same way → redeploy (env var changes don't apply to already-built
deployments).

These 6 values are not secret — Firebase's web config is designed to be
visible in the browser bundle. The actual security boundary is the rules
file from step 6 and the authorized-domains list from step 4, not hiding
this config.

## 8. Test it

Locally: `npm run dev` → you should land on the login screen → **Continue
with Google** → redirected to Google → back to the app, signed in, with
default habits seeded. Open the same account in a second tab or another
device and check a habit — it should appear in the first tab within a
second or two without a refresh. That live update is the actual fix for
the cross-page/cross-device sync issue.

## Known limitation

Any habit data you accumulated **before** this change was sitting in your
browser's local IndexedDB (the old storage), and won't automatically carry
over — every account starts fresh with the default seeded habits, same as
a first-time install. This is expected for a first Firebase rollout; if
you specifically need to preserve that old test data, say so and I can add
a one-time import path for it.

## If `npm run build` errors

The single riskiest line in this integration is the persistent multi-tab
cache setup in `lib/firebase/config.ts` (`initializeFirestore` +
`persistentLocalCache` + `persistentMultipleTabManager`) — it's a newer
part of the Firebase SDK's API surface that I couldn't verify against real
installed types in this environment (no internet access here to run
`npm install`). If a build error points there, paste me the message and
I'll have a fix back to you fast, same as the last few rounds.
