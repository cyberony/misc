# Natural-language reminders (superuser / admin)

Admins and superusers can add reminders from the **Tools** panel on the home page left sidebar. Each reminder is stored on the server and, when the due time is reached, an email is sent to the **same address as the account** (from the users table).

## How it works

1. User enters free text, e.g. `Remind me April 12 that I need to email Jordan about the practicum`.
2. The server uses **[chrono-node](https://github.com/wanasit/chrono)** to find the **first** date/time expression in the text and treats the rest as the **title**.
3. If no date can be parsed, the API returns `400` with a short hint.
4. A background job runs on a **cron schedule** (default: every **15 minutes**, `America/Chicago`) and sends email for any reminder where `dueAt <= now` and `sentAt` is still empty.

## Data

- **File:** `data/reminders.json` (gitignored by default). Shape: `{ "reminders": [ { id, userId, email, title, dueAt, rawText, createdAt, sentAt } ] }`.
- **Email:** Uses the same SMTP settings as password reset (`SMTP_HOST`, `SMTP_FROM`, …).

## API

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/reminders` | Lists the current user’s reminders only. |
| `POST` | `/api/reminders` | Body: `{ "text": "..." }`. Requires admin or superuser. |
| `DELETE` | `/api/reminders/:id` | Removes own reminder. |

## Environment

See [`.env.example`](../.env.example): `REMINDER_EMAIL_ENABLED`, `REMINDER_CRON`, `REMINDER_TZ`, `REMINDER_DISPLAY_TZ`.

## Caveats

- Parsing quality depends on phrasing; ambiguous dates may resolve unexpectedly—users should verify the saved list in the sidebar.
- If SMTP is misconfigured, emails will fail; check server logs.
