# server/services/

Core business logic classes. Each is a singleton exported as a module instance.

## Files

| File | Purpose |
|------|---------|
| `ScraperService.js` | Launches Playwright with a persistent Chrome profile, navigates LinkedIn search results, extracts email addresses from posts. Emits `log` and `status` events for real-time UI updates via SSE. Handles headless/visible mode switching for login. |
| `EmailService.js` | Sends emails via Gmail SMTP (Nodemailer) with resume attachment. Batch-removes sent emails from queue and records them in SentEmailManager. Emits `log` events for progress tracking. |
| `CronService.js` | Schedules automatic scraping using `node-cron`. Persists config to `Data/cron.json`. Optionally triggers auto-send after scraping. Maintains an activity log. |
