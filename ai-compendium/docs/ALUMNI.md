# Alumni directory & LinkedIn snapshot checks

This document describes the MSAI alumni spreadsheet integration: the **superuser/admin web table**, **data files**, **daily LinkedIn metadata comparison**, and **email notifications** when public profile text changes.

## Who can see what

- **Web UI:** [`/alumni.html`](../public/alumni.html) — same site as the compendium. The **Tools** sidebar on the home page (left pane) includes an **Alumni** card with a button to this page when the signed-in user’s **actual role** is **admin** or **superuser** (not regular users). There is no alumni link in the top bar.
- **API:** `GET /api/alumni` — requires `Authorization: Bearer <token>`; responds with `403` unless the user is admin or superuser.

Related: **[REMINDERS.md](REMINDERS.md)** (same sidebar **Tools** panel).

## Data files (under `ai-compendium/`)

| File | Purpose |
|------|---------|
| `data/alumni/MSAI_Alumni_Database.xlsx` | **Source spreadsheet** (same column headers as import). After a LinkedIn snapshot run or **Download .xlsx**, the server refreshes **Company** and **Title** from public LinkedIn meta (when available) and **rewrites this file** using the same columns as [`import-alumni.js`](../scripts/import-alumni.js) — no extra columns. |
| `data/alumni.json` | JSON consumed by the server and API. Normally regenerated with `npm run import-alumni` after you replace the `.xlsx`. The server may also update **`Company` / `Title`** from the LinkedIn snapshot and set `linkedInSyncedAt` when it persists those merges. |
| `data/alumni-linkedin-snapshot.json` | **Runtime** cache of the last LinkedIn “fingerprint” per profile URL, plus `meta.lastRunAt`. Listed in `.gitignore` so it is not committed by default (each deployment builds its own baseline). |

### Re-importing after spreadsheet changes

```bash
cd ai-compendium
# Place the updated Excel file at data/alumni/MSAI_Alumni_Database.xlsx
npm run import-alumni
```

Restart the server if it is already running so it reads the new `data/alumni.json`.

The import script is [`scripts/import-alumni.js`](../scripts/import-alumni.js). It reads the **first sheet** and maps columns by header name (e.g. `Graduation Term`, `LinkedIn Profile`, …).

## Daily job: “did someone change jobs?”

The server **does not** use the official LinkedIn API. It performs an **HTTP GET** to each public profile URL and parses **HTML meta tags** (`og:title`, `og:description`) that LinkedIn often embeds for link previews. From that it builds a **fingerprint** string (see [`lib/alumni.js`](../lib/alumni.js): `jobFingerprint()`).

- **Schedule:** [node-cron](https://www.npmjs.com/package/node-cron) runs [`runAlumniLinkedInDailyCheck()`](../server.js) on a cron expression (default **`0 8 * * *`** at **`America/Chicago`**).
- **First run** for a key: records a snapshot **without** emailing (no previous fingerprint to compare).
- **Later runs:** if the fingerprint **differs** from the stored one, the change is collected and **one email** is sent listing all alumni with changes in that run.
- After each run, the server **merges** the latest snapshot into **`Company` / `Title`** in `alumni.json` (when derivable) and **rewrites** `data/alumni/MSAI_Alumni_Database.xlsx` with the **same headers** as import.

### Download .xlsx

The alumni page download uses the same merge. The response file matches **`data/alumni/MSAI_Alumni_Database.xlsx`**, which is updated on download (and `alumni.json` is updated if merged rows differ from what was on disk).

### Limitations (important for operators)

- LinkedIn may **rate-limit**, **change HTML**, or show **login walls** for some requests; fetches can fail silently for a row (check server logs).
- **False positives** / **false negatives** are possible when LinkedIn tweaks wording or A/B tests.
- Automated scraping may conflict with **LinkedIn’s terms of use**; use this feature responsibly and at your own risk.

### Environment variables

Documented in [`.env.example`](../.env.example). Summary:

| Variable | Meaning |
|----------|---------|
| `ALUMNI_NOTIFY_EMAIL` | Recipient for **job-change** digest emails (typically the admin). If unset, snapshots still update but **no email** is sent. |
| `ALUMNI_ADMIN_EMAIL` | Optional alias; used only if `ALUMNI_NOTIFY_EMAIL` is empty. |
| `ALUMNI_CHECK_ENABLED` | Set to `false` to **disable** the scheduled job only (the alumni page and API still work). |
| `ALUMNI_CRON` | Cron expression (default `0 8 * * *`). |
| `ALUMNI_TZ` | IANA timezone (default `America/Chicago`). |
| `ALUMNI_FETCH_GAP_MS` | Minimum milliseconds between LinkedIn HTTP requests (default `1500`). |

Email uses the same **SMTP** settings as password reset (`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, …).

### Manual trigger (admins only)

`POST /api/admin/alumni/check-now` with a valid **admin** Bearer token runs the same check immediately (useful for testing after deploy).

## Code map

| Area | Location |
|------|----------|
| HTTP routes + cron + email | [`server.js`](../server.js) (`/api/alumni`, `/api/admin/alumni/check-now`, `runAlumniLinkedInDailyCheck`, `sendAlumniJobChangeEmail`) |
| LinkedIn URL normalization, HTML parse, fingerprint | [`lib/alumni.js`](../lib/alumni.js) |
| Import script | [`scripts/import-alumni.js`](../scripts/import-alumni.js) |
| Alumni table UI | [`public/alumni.html`](../public/alumni.html), [`public/alumni.js`](../public/alumni.js) |
| Table styles | [`public/styles.css`](../public/styles.css) (`.alumni-*`) |
| Header link visibility | [`public/app.js`](../public/app.js) (`#alumniDirectoryLink`), [`public/index.html`](../public/index.html) |

## Related

- Superuser vs admin roles are defined in the main app auth model; see server `normalizePublicRole` and client `getEffectiveRole()`.
