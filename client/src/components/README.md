# client/src/components/

One component per tab in the app.

## Files

| File | Purpose |
|------|---------|
| `Dashboard.jsx` | Overview tab — stat cards (queue count, sent count, scraper status), email queue table with pagination, add-email input, filter, delete, send-all button, sent history table with pagination. |
| `ScraperPanel.jsx` | Scraper tab — start/stop scraping, live log viewer via SSE, stat cards (new emails, total queue, cycles), view-emails and send-emails buttons. |
| `SettingsPanel.jsx` | Settings tab — two-column layout: targeting (role dropdown with grouped categories + search), email templates (subject + body), SMTP credentials (Gmail + app password), automation toggle (auto-send after scrape). |
| `CronPanel.jsx` | Cron Job tab — schedule builder (interval or specific hours, day-of-week chips, month chips), enable/disable toggle, auto-send option, run-now button, generated cron expression preview, recent activity log. |
