<<<<<<< HEAD
# Job Scraper Dashboard

Frontend dashboard for a private job scraping pipeline that collects and scores jobs from LinkedIn, Naukri, Indeed, and future job sources.

The frontend is safe to publish publicly. It does not need scraper credentials, browser profiles, database files, or raw backend secrets. It reads job data through local Next.js API routes that can point to a private backend folder on your machine.

## What This Dashboard Does

- Shows real scraped jobs from the backend `jobs.csv` file.
- Displays KPI cards for total jobs found, active jobs, jobs scraped today, and scraper success rate.
- Shows scraper analytics by source, including LinkedIn, Naukri, and Indeed counts.
- Renders an AG Grid job table with sorting, filtering, pagination, resizing, sticky columns, and bulk selection.
- Lets you filter jobs by source, work mode, posted date range, and minimum GPT score.
- Supports global search across job title, company, location, source, and description.
- Opens a detailed drawer for each job with score breakdown, GPT summary, GPT reasoning, description, skills, and status.
- Lets you change job status locally, such as `UNAPPLIED`, `APPLIED`, `INTERVIEW`, `REJECTED`, `OFFER`, `EXPIRED`, and `SAVED`.
- Exports the currently filtered job list to CSV.
- Includes saved search presets for fast filtering.
- Supports light and dark themes.
- Shows toast notifications for exports, apply-link clicks, and optional realtime events.

## Data Flow

The private backend writes scraped jobs to:

```text
jobs.csv
jobs.db
log.txt
```

The frontend reads only `jobs.csv` through:

```text
app/api/jobs/route.ts
```

That API route maps backend CSV columns into the dashboard `Job` model:

- `title` -> `jobTitle`
- `company` -> `company`
- `job_url` -> `applyLink`
- `source` -> `source`
- `experience_required` -> `experienceRequired`
- `job_description` -> `description`
- `final_score` / `gpt_score` / `pre_score` -> dashboard score fields
- `reason` -> GPT reasoning
- `created_at` -> scraped and posted timestamps

Analytics are generated from the same real job list through:

```text
app/api/analytics/route.ts
```

## Backend Folder Configuration

By default, the frontend looks for the backend data folder here:

```text
C:\Users\Nishant Chandraker\Downloads\private-job-scraper-main\private-job-scraper-main
```

To use another backend path, create `.env.local` in the frontend root:

```powershell
JOB_SCRAPER_DATA_DIR=C:\path\to\private-job-scraper-main
```

An example file is included:

```text
.env.local.example
```

Do not commit `.env.local`; it is ignored by Git.

## Run The App

Install dependencies:

```powershell
cd "C:\Users\Nishant Chandraker\Documents\Codex\2026-06-04\help-me-di-all-the-libraries\outputs\job-scraper-dashboard"
npm install
```

Start the Next.js development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verify Real Backend Data

With the dev server running, open:

```text
http://localhost:3000/api/jobs
```

You should see JSON containing real scraped jobs from the backend CSV.

Open:

```text
http://localhost:3000/api/analytics
```

You should see counts grouped by scraper source.

## Optional Mock Realtime Events

The app includes a mock realtime event simulator from the prototype stage. It is disabled by default so it does not show fake "new job scraped" popups.

To enable mock events for UI demos:

```powershell
NEXT_PUBLIC_ENABLE_MOCK_REALTIME=true
```

Keep this disabled for real scraper usage unless you intentionally want demo events.

## Main Frontend Files

```text
app/page.tsx                         Main dashboard page
app/api/jobs/route.ts                Reads and maps backend jobs.csv
app/api/analytics/route.ts           Builds dashboard analytics from real jobs
components/jobs/job-grid.tsx         AG Grid job table
components/jobs/filters-bar.tsx      Source, work mode, date, and score filters
components/jobs/job-details-drawer.tsx
components/dashboard/kpi-strip.tsx
components/dashboard/scraper-analytics.tsx
hooks/use-live-jobs.ts               Optional mock realtime subscription
lib/api/jobs.ts                      Client-side API calls
store/dashboard-store.ts             Zustand dashboard state
types/jobs.ts                        Shared dashboard types
```

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- AG Grid
- TanStack Query
- Zustand
- Recharts
- Framer Motion
- Lucide React

## Public Repository Safety

This frontend can be pushed to the public repository:

```text
https://github.com/nishant73/Job-Scrapper-LinkedIn-Naukri-Indeed-
```

The frontend `.gitignore` excludes:

- `node_modules/`
- `.next/`
- `.env`
- `.env.*`
- logs
- TypeScript build cache

The private backend repository should keep credentials and scraper runtime data separate:

```text
https://github.com/nishant73/private-job-scraper
```

Recommended private backend ignores:

- `.env`
- `jobs.db`
- `jobs.csv`
- `log.txt`
- `__pycache__/`
- virtual environments
- browser/session/cache files

Even for a private repo, avoid committing API keys unless you deliberately want that risk.

## Push Frontend To GitHub

```powershell
cd "C:\Users\Nishant Chandraker\Documents\Codex\2026-06-04\help-me-di-all-the-libraries\outputs\job-scraper-dashboard"

git init
git branch -M main
git remote add origin https://github.com/nishant73/Job-Scrapper-LinkedIn-Naukri-Indeed-.git
git add .
git commit -m "Connect dashboard to real scraper data"
git push -u origin main
```

If the repo already exists locally, use:

```powershell
git remote -v
git status
git add .
git commit -m "Connect dashboard to real scraper data"
git push
```

## Troubleshooting

If the dashboard shows zero jobs:

- Confirm the backend has a `jobs.csv` file.
- Confirm `JOB_SCRAPER_DATA_DIR` points to the folder containing `jobs.csv`.
- Open `/api/jobs` and check for an error message.
- Restart `npm run dev` after changing `.env.local`.

If the job count appears but table rows do not render:

- Make sure `ag-grid-community` and `ag-grid-react` are installed.
- The grid registers `AllCommunityModule` and uses `theme="legacy"` for AG Grid v33 CSS theme compatibility.

If you see only popup notifications:

- Keep `NEXT_PUBLIC_ENABLE_MOCK_REALTIME` unset or set to `false`.
- Real jobs come from `/api/jobs`, not the mock realtime simulator.
=======
# foreverScraper

Job scraping and scoring pipeline for LinkedIn, Naukri, and Indeed.

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your API and email credentials in `.env`
3. Edit `config.py` to update:
   - candidate profile
   - resume summary
   - key skills and skill weights
   - score threshold
   - scraper keywords and locations
   - Selenium Chrome profile paths
   - logged-in browser profile settings for Indeed and Naukri
4. Run the project

## Main User Config

Most user-specific values live in `config.py`.

Important sections:

- `APP_CONFIG["candidate"]`
- `APP_CONFIG["ranking"]`
- `APP_CONFIG["scrapers"]`
- `APP_CONFIG["files"]`

## Notes For Other Users

- Do not commit your real `.env`
- Update the Selenium profile paths in `config.py` if your machine uses different Chrome profile directories
- Indeed and Naukri are expected to run with logged-in Chrome profiles. Set `use_logged_in_profile`, `chrome_profile_dir`, and `chrome_profile_name` in `config.py` before running.【This matters especially for anti-bot checks and account-specific job visibility】
- `jobs.db`, `jobs.csv`, and `log.txt` paths are also centralized in `config.py`

## Logged-In Profiles

This project uses persistent Chrome profiles for some scrapers:

- Indeed: uses a logged-in Chrome profile from `APP_CONFIG["scrapers"]["indeed"]`
- Naukri: uses a logged-in Chrome profile from `APP_CONFIG["scrapers"]["naukri"]`

If another user is setting up the project, they should:

1. Create or locate a Chrome user profile on their own machine
2. Log in manually to Indeed and Naukri in that browser profile
3. Put that local profile path into `config.py`
4. Keep `.env` separate for API and email credentials
>>>>>>> 904266b136c8173f3fde40df3881d61291798f25
