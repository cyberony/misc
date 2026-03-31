# Natural-language reminders (superuser / admin)

Admins and superusers can add reminders from the **Tools** panel on the home page left sidebar. Each reminder is stored on the server and, when the due time is reached, an email is sent to the **same address as the account** (from the users table).

## How it works

1. User enters free text, e.g. `Remind me April 12 that I need to email Jordan about the practicum`.
   - Recurring phrases are supported, e.g. `daily`, `weekly`, `monthly`, `every 2 weeks`, and `daily next week at 11am`.
2. The server uses **[chrono-node](https://github.com/wanasit/chrono)** to find the **first** date/time expression in the text and treats the rest as the **title**.
3. If no date can be parsed, the API returns `400` with a short hint.
4. The server schedules an in-memory **timer** per reminder and sends email when `dueAt` is reached (or immediately on startup if a due reminder was missed while offline).
5. Recurring reminders automatically advance `dueAt` to the next occurrence after each send; they archive only after the recurrence window ends.

## Data

- **File:** `data/reminders.json` (gitignored by default). Shape: `{ "reminders": [ { id, userId, email, title, dueAt, rawText, createdAt, sentAt } ] }`.
- **Email:** Uses the same SMTP settings as password reset (`SMTP_HOST`, `SMTP_FROM`, …).

## API

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/reminders` | Lists the current user’s reminders only. |
| `POST` | `/api/reminders` | Body: `{ "text": "..." }`. Requires admin or superuser. |
| `PUT` or `PATCH` | `/api/reminders/:id` | Body: `{ "text": "..." }`. Re-parses date; clears `sentAt` if `dueAt` changed so a new due time can email again. |
| `DELETE` | `/api/reminders/:id` | Removes own reminder. |

## Environment

See [`.env.example`](../.env.example): `REMINDER_EMAIL_ENABLED`, `REMINDER_CRON`, `REMINDER_TZ`, `REMINDER_DISPLAY_TZ`.

## Caveats

- Parsing quality depends on phrasing; ambiguous dates may resolve unexpectedly—users should verify the saved list in the sidebar.
- If SMTP is misconfigured, emails will fail; check server logs.
