# client/

React frontend built with Vite. Runs on port 5173 in dev mode, proxies API calls to the Express server on port 3001.

## Structure

```
client/
├── index.html        # HTML entry point
├── package.json      # Client dependencies (React, Vite)
├── vite.config.js    # Vite config with API proxy to port 3001
├── dist/             # Production build output (auto-generated)
└── src/
    ├── main.jsx      # React app mount point
    ├── App.jsx       # Root component — tab navigation with slide animations
    ├── App.css       # Global styles — dark theme, stat cards, panels, tables
    └── components/   # Page components (one per tab)
```
