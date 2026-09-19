# Habit OS

A local-first personal habit tracking and self-improvement system.

> Track → Analyze → Reflect → Improve

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Dexie (IndexedDB),
Chart.js and Framer Motion. Works fully offline, installs as a PWA, and stores
all data on-device — no account, no backend, no tracking.

## Architecture

```
app/                  Route pages (App Router), one folder per screen
components/
  layout/              Sidebar, mobile nav, page header, month selector
  ui/                   Button-less design system pieces: modal, toast, kpi card, etc.
  habits/                Habit/category checkboxes, rows, editors
  tracker/                The monthly grid
  calendar/                Monthly calendar + heatmap + day detail modal
  charts/                   Chart.js registration
  pwa/                        Service worker registration, theme sync
lib/
  data/                 DataRepository abstraction
    repository.ts        the interface every storage backend implements
    local-repository.ts   IndexedDB implementation (used today)
    firebase-repository.ts  placeholder for future cloud sync
    db.ts                 Dexie schema
    seed.ts                default habits/categories, sourced from the original workbook
  dates.ts             Calendar-correct date utilities (leap years, month lengths, etc.)
  streaks.ts           Streak engine (per-habit + overall)
  analytics.ts         Goal completion vs. daily consistency calculations
  export.ts            JSON backup + CSV export/import
hooks/
  useAppData.tsx        Central app state (loads once, all pages subscribe to it)
  useChartColors.ts      Keeps charts in sync with light/dark theme
types/                 Shared TypeScript types
public/
  manifest.json          PWA manifest
  sw.js                   Minimal offline-shell service worker
  icons/                   App icons (incl. maskable variants)
```

### Why a repository abstraction?
Every page talks to `lib/data/index.ts` → `repository`, never to Dexie directly.
`LocalRepository` implements it today with IndexedDB. When you're ready for
multi-device sync, implement `FirebaseRepository` against the same interface
and swap one line in `lib/data/index.ts` — no component changes required.

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

## Data storage & backup

All data lives in IndexedDB, scoped to the browser/device you're using —
nothing is sent anywhere. Because of that:

- Clearing site data / browser storage will delete it. **Export a backup
  regularly** (Data & Backup → Export backup) if that matters to you.
- Data does **not** sync across devices or browsers by itself (see Firebase
  section below).
- **Data & Backup** page: export a full JSON backup, import one back
  (merge or replace), and export your completion history as CSV.

## Adding future Firebase sync (optional, not required to run the app)

1. Create a Firebase project, add the config to environment variables.
2. Implement each method of `DataRepository` in
   `lib/data/firebase-repository.ts` against Firestore (and Firebase Auth
   if you want accounts).
3. In `lib/data/index.ts`, change:
   ```ts
   export const repository: DataRepository = new LocalRepository();
   ```
   to:
   ```ts
   export const repository: DataRepository = new FirebaseRepository();
   ```
4. Nothing else changes — every page already goes through `repository`.

## Environment variables

None required to run the app. One optional variable enables analytics:

| Variable | Required? | Purpose |
|---|---|---|
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
  personal single-user app.
- `FirebaseRepository` is an unimplemented placeholder by design (per the
  "don't require Firebase in v1" requirement) — it throws a clear error if
  ever selected before you implement it.
