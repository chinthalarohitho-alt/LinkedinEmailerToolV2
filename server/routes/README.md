# server/routes/

Express route handlers for the REST API.

## Files

| File | Routes | Purpose |
|------|--------|---------|
| `scraper.js` | `POST /api/scrape/start`, `POST /api/scrape/stop`, `GET /api/scrape/status`, `GET /api/scrape/stream` | Start/stop scraper, get status, SSE stream for real-time logs |
| `emails.js` | `GET /api/emails`, `POST /api/emails/add`, `DELETE /api/emails/:email`, `POST /api/emails/send`, `GET /api/emails/sent` | Manage email queue (list, add, delete), trigger send, view sent history |
| `settings.js` | `GET /api/settings`, `PUT /api/settings`, `GET /api/settings/template`, `PUT /api/settings/template` | Read/update app settings and email template |
| `cron.js` | `GET /api/cron`, `PUT /api/cron`, `POST /api/cron/run` | Get/update cron schedule, trigger manual run |
