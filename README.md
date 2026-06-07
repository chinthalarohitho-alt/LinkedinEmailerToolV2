# LinkedIn Emailer Tool

A web-based tool to scrape LinkedIn posts for job opportunities and automatically send application emails with your resume.

Built with React, Express, Playwright, and Nodemailer.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Google Chrome](https://www.google.com/chrome/) installed
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) (requires 2FA enabled)

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/chinthalarohitho-alt/LinkedinEmailerTool.git
   cd LinkedinEmailerTool
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install --prefix client
   ```

3. **Add your resume**

   Place your resume PDF in the `Data/` folder (e.g., `Data/resume.pdf`).

## Starting the App

### Option 1: Double-click launcher

| OS      | File                              |
|---------|-----------------------------------|
| macOS   | `Click Me to Start (Mac).command` |
| Windows | `Click Me to Start (Windows).bat` |

Double-click the file. It installs dependencies if needed, starts the app, and opens your browser to `http://localhost:5173`.

### Option 2: Terminal

```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Stopping the App

- **If launched via double-click** — close the terminal window, or press `Ctrl + C` in it.
- **If launched via terminal** — press `Ctrl + C` in the terminal.

## First Run

1. Go to **Settings** tab and enter your Gmail address, App Password, email subject, and email body template.
2. Go to **Scraper** tab and click **Start Scraping**. A Chrome window will open for LinkedIn login on the first run. Log in manually — your session is saved for future runs (headless).
3. Scraped emails appear in the **Dashboard**. Click **Send All** to send emails, or enable **Auto-send** in Settings.
4. Optionally, set up a **Cron Job** tab schedule for automatic scraping.

## Contact

For queries or support, reach out at **chinthalarohitho@gmail.com**.
