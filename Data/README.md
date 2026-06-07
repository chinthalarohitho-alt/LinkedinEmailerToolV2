# Data/

Runtime data directory. All files here are generated/managed by the app — do not edit manually unless needed.

## Files

| File | Purpose |
|------|---------|
| `Emails.txt` | Email queue — one email per line, scraped from LinkedIn posts. Emails are removed after sending. |
| `EmailTemplate.txt` | Email body template sent to recipients. Editable from the Settings tab. |
| `settings.json` | App settings — search role, email subject, SMTP credentials, auto-send toggle. Editable from the Settings tab. |
| `SentEmails.json` | Record of sent emails with timestamps. Used to prevent duplicate sends. Entries expire after 96 hours. |
| `cron.json` | Cron job configuration — schedule, enabled state, auto-send flag. Editable from the Cron Job tab. |

## Directories

| Directory | Purpose |
|-----------|---------|
| `ChromeProfile/` | Persistent Chrome browser profile. Stores LinkedIn session cookies so you only need to log in once. |
