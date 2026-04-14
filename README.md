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
