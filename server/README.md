# server/

Express.js backend that powers the API. Runs on port 3001.

## Structure

```
server/
├── index.js          # Express app entry point, mounts all routes
├── lib/              # Shared utilities and configuration
├── routes/           # API route handlers
└── services/         # Core business logic (scraper, email, cron)
```

## Entry Point

`index.js` — Starts the Express server, registers API routes under `/api/*`, and serves the React build as static files.
