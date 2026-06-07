# server/lib/

Shared configuration and utility functions used across the server.

## Files

| File | Purpose |
|------|---------|
| `config.js` | Central config module — all file paths (`Data/Emails.txt`, `settings.json`, etc.), settings loader/saver, email queue read/write/remove, template loader, and resume discovery. Every other server file imports from here instead of doing its own file I/O. |
