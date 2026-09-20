# Habit OS

A personal habit tracking and self-improvement system with real-time sync.

> Track → Analyze → Reflect → Improve

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Firebase
(Auth + Firestore), Chart.js and Framer Motion. Sign in with Google, and
your data syncs live across every tab and device — installs as a PWA too.

**Setup:** see `FIREBASE_SETUP.md` for the required Firebase project setup
(this app won't run without it — Firestore is the only data store now).

## Architecture

```
app/                  Route pages (App Router), one folder per screen
components/
  auth/                LoginScreen, AuthGate (shown instead of the app when signed out)
  layout/              Sidebar, mobile nav, page header, month selector
  ui/                   Button-less design system pieces: modal, toast, kpi card, etc.
  habits/                Habit/category checkboxes, rows, editors
  tracker/                The monthly grid
  calendar/                Monthly calendar + heatmap + day detail modal
  charts/                   Chart.js registration
  pwa/                        Service worker registration, theme sync
lib/
  firebase/             Firebase app/auth/Firestore initialization
  data/                 DataRepository abstraction
    repository.ts        the interface every storage backend implements
    firebase-repository.ts  Firestore implementation (active today) — real-time via onSnapshot
    local-repository.ts   IndexedDB implementation, kept for reference / possible offline mode
    seed.ts                default habits/categories, sourced from the original workbook
  dates.ts             Calendar-correct date utilities (leap years, month lengths, etc.)
  streaks.ts           Streak engine (per-habit + overall)
  analytics.ts         Goal completion vs. daily consistency calculations
  export.ts            JSON backup + CSV export/import
hooks/
  useAuth.tsx            Firebase auth state (Google sign-in via redirect)
  useAppData.tsx        Central app state, live-subscribed to Firestore, all pages read from it
  useChartColors.ts      Keeps charts in sync with light/dark theme
types/                 Shared TypeScript types
public/
  manifest.json          PWA manifest
  sw.js                   Minimal offline-shell service worker
  icons/                   App icons (incl. maskable variants)
firestore.rules        Security rules — each user can only access their own data
```

### Why a repository abstraction?
Every page talks to `lib/data/index.ts` → `repository`, never to Firestore
directly. `FirebaseRepository` implements it today, with a `subscribeAll()`
method pages use for real-time updates — that's the actual mechanism behind
data staying in sync across tabs and devices. Swapping storage backends
again in the future (if ever needed) is still just one line in
`lib/data/index.ts`.

## Local development


Requirements: Node.js 18.18+ (Node 20 LTS recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`.

On first load, the app seeds itself with the habits from your original
workbook (Wake up early, Gym, Sleep Early, Reading books, Online Class,
Uni Class, Office, Project work, LinkedIn, Writing, Learning) grouped into
Health / Fitness / Growth / Education / Career / Creativity. Everything is
editable from the Habits screen.

## Build

```bash
npm run build
npm run start   # serve the production build locally
```

`npm run build` must complete with no TypeScript or ESLint errors before
deploying — if you've customized code, run this before pushing.

## Deploying to Vercel

1. Push this project to a GitHub repository (see "GitHub web upload" below
   if you'd rather not use git locally).
2. Go to https://vercel.com/new, import the repository.
3. Framework preset: **Next.js** (auto-detected). No environment variables
   are required for v1.
4. Deploy. Vercel will run `npm install && npm run build` automatically.

## GitHub web upload (no git required)

1. Unzip `habit-os.zip` on your computer.
2. Create a new repository on github.com (Add file → nothing needed yet,
   just create an empty repo).
3. Open the repo → **Add file → Upload files**.
4. Drag the *contents* of the unzipped `habit-os` folder (not the folder
   itself — select everything inside it) into the browser upload area.
   GitHub's uploader preserves subfolders, so `app/`, `components/`, `lib/`,
   etc. will land in the right place.
5. Commit directly to `main`.
6. Import that repo into Vercel as described above.

> Tip: GitHub's web uploader has a per-commit file count/size limit. This
> project is small (well under it), so one upload should work in one go.

## PWA / installing on your device

Once deployed (PWA installability requires HTTPS, so it won't offer to
install from `localhost` in most browsers):

- **Desktop Chrome/Edge:** an install icon appears in the address bar.
- **Android Chrome:** menu → "Install app" / "Add to Home screen".
- **iOS Safari:** Share → "Add to Home Screen" (iOS doesn't show an
  automatic install prompt for PWAs — this manual step is normal for any
  web app on iOS, not specific to Habit OS).

The service worker (`public/sw.js`) caches the app shell so it keeps working
with no connection after the first visit.

## Data storage, sync & backup

Data lives in Firestore, under `users/{your-uid}/...`, and syncs in
real time — checking a habit on your phone shows up on your laptop within
a second or two, no refresh needed. That live update comes from
`repository.subscribeAll()` in `lib/data/firebase-repository.ts`, which
every page is subscribed to via `useAppData()`.

- Firestore also keeps a local persistent cache (`lib/firebase/config.ts`),
  so the app still works offline and across multiple tabs on one device —
  changes queue locally and sync once you're back online.
- Access is restricted to each signed-in user's own data — see
  `firestore.rules`. No one, including other signed-in users, can read
  someone else's habits.
- **Data & Backup** page still works the same as before: export a full
  JSON backup, import one back (merge or replace), export CSV.
- Signing out and back in with the same Google account restores everything
  — nothing is tied to a single device or browser anymore.

## Adding cloud sync — already done; here's what changed

This used to be a "future" section describing how to add Firebase. That
migration is now complete:

1. `lib/data/firebase-repository.ts` implements every `DataRepository`
   method against Firestore, plus `subscribeAll()` for real-time push.
2. `lib/data/index.ts` now exports `new FirebaseRepository()` as the active
   repository.
3. `hooks/useAuth.tsx` + `components/auth/` gate the whole app behind
   Google Sign-In (`components/auth/AuthGate.tsx` shows
   `LoginScreen.tsx` until someone's signed in).

`LocalRepository`/Dexie/IndexedDB-as-primary-store are no longer used, but
the code is left in place in case an offline-only mode is ever wanted
again — swapping back is still just editing that one line in
`lib/data/index.ts`, same as before.

## Environment variables

Firebase config (6 values) is **required** now — see `FIREBASE_SETUP.md`.
One more variable is optional:

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 values) | **Yes** | Firebase project config — see `FIREBASE_SETUP.md` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`). Leave unset and GA never loads — zero extra network calls. |

### Adding Google Analytics
1. Create a GA4 property at https://analytics.google.com and copy its Measurement ID.
2. In Vercel: **Project → Settings → Environment Variables** → add
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX` → Save.
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy). `components/analytics/GoogleAnalytics.tsx`
   picks it up automatically and loads `gtag.js`.
4. Give it a few minutes, then check **Reports → Realtime** in GA while visiting your
   own site to confirm it's tracking.

### Editing the footer social links
`components/layout/Footer.tsx` has three constants at the top
(`GITHUB_URL`, `FACEBOOK_URL`, `LINKEDIN_URL`) — replace those with your real
profile URLs.

### Install prompt behavior
`components/pwa/InstallPrompt.tsx` shows a dismissible top banner:
- **Chrome/Edge (desktop & Android):** uses the native `beforeinstallprompt`
  event — clicking "Install" triggers the real browser install dialog.
- **iOS Safari:** shows manual instructions (Share → Add to Home Screen),
  since iOS doesn't expose a programmatic install API to websites.
- Already-installed visitors (`display-mode: standalone`) never see it.
- Dismissing it hides it for 14 days (stored in `localStorage`, per device).

## Known limitations / honest notes

- The service worker uses a straightforward stale-while-revalidate cache
  rather than a generated precache manifest, so it's robust but not as
  finely tuned as `next-pwa`/Workbox would be. It's sufficient for a
  personal app.
- The persistent multi-tab Firestore cache setup in `lib/firebase/config.ts`
  uses a newer part of the Firebase SDK surface that couldn't be verified
  against real installed types in the sandbox this was built in (no
  internet access to run `npm install` there) — see `FIREBASE_SETUP.md`'s
  last section if `npm run build` errors near that file.
- Old data from before this Firebase migration (if you were using an
  earlier IndexedDB-only version of this app) does not automatically carry
  over — every account starts fresh with the seeded default habits.
