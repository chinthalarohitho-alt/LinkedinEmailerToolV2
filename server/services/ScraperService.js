const { chromium } = require("playwright");
const fs = require("fs");
const EventEmitter = require("events");
const sentEmailManager = require("../../utils/SentEmailManager");
const { loadSettings, readEmailQueue, appendToQueue, ensureDataDir, EMAILS_FILE, CHROME_PROFILE_DIR } = require("../lib/config");

const MAX_CYCLES = 25;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

class ScraperService extends EventEmitter {
  constructor() {
    super();
    this.status = "idle";
    this.stats = { totalEmails: 0, newEmails: 0, cycles: 0 };
    this.context = null;
    this.stopping = false;
  }

  log(message) {
    this.emit("log", `[${new Date().toLocaleTimeString()}] ${message}`);
    this.emit("status", this.getStatus());
  }

  async start({ searchRole } = {}) {
    if (this.status === "running") throw new Error("Scraper is already running");

    const settings = loadSettings();
    const role = searchRole || settings.searchRole;

    this.status = "running";
    this.stopping = false;
    this.stats = { totalEmails: 0, newEmails: 0, cycles: 0 };

    try {
      await this._run(role);
      this.status = this.stopping ? "idle" : "done";

      if (!this.stopping && settings.autoSendAfterScrape && this.stats.newEmails > 0) {
        this.status = "sending";
        this.log("Auto-sending emails...");
        this.emit("status", this.getStatus());
        const emailService = require("./EmailService");
        const onLog = (msg) => this.emit("log", msg);
        emailService.on("log", onLog);
        try {
          const results = await emailService.sendAll();
          this.log(`Sent: ${results.sent}, Failed: ${results.failed}`);
        } catch (e) {
          this.log(`Auto-send error: ${e.message}`);
        } finally {
          emailService.off("log", onLog);
          this.status = "done";
          this.emit("status", this.getStatus());
        }
      }
    } catch (err) {
      this.status = "error";
      this.log(`Error: ${err.message}`);
    } finally {
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
      }
    }
  }

  async stop() {
    if (this.status !== "running") return;
    this.stopping = true;
    this.log("Stop requested...");
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    this.status = "idle";
    this.log("Scraper stopped.");
  }

  async _run(searchRole) {
    fs.mkdirSync(CHROME_PROFILE_DIR, { recursive: true });

    const launchOpts = (headless) => ({
      headless: false,
      channel: "chrome",
      args: [
        "--disable-blink-features=AutomationControlled",
        ...(headless ? ["--headless=new"] : ["--start-maximized"]),
      ],
    });

    this.log("Launching browser (headless)...");
    this.context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, launchOpts(true));
    let page = this.context.pages()[0] || await this.context.newPage();

    this.log("Checking LinkedIn session...");
    sentEmailManager.cleanup();
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "load" });

    if (page.url().includes("login") || page.url().includes("checkpoint")) {
      this.log("Login required — reopening browser in visible mode...");
      await this.context.close();

      this.context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, launchOpts(false));
      page = this.context.pages()[0] || await this.context.newPage();
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "load" });

      this.log("Please log in manually in the browser window.");
      this.log("Waiting up to 5 minutes...");
      await page.waitForURL("**/feed/**", { timeout: 300000 });
      this.log("Login successful! Session saved. Next run will be headless.");

      await this.context.close();
      this.context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, launchOpts(true));
      page = this.context.pages()[0] || await this.context.newPage();
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "load" });
    } else {
      this.log("Already logged in — running headless.");
    }

    if (this.stopping) return;

    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(searchRole)}&datePosted=%5B%22past-24h%22%5D&origin=FACETED_SEARCH`;
    this.log(`Searching for: "${searchRole}" (Past 24h)...`);
    await page.goto(searchUrl, { waitUntil: "load" });
    await page.waitForSelector('[data-testid="lazy-column"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const dismiss = page.locator('button[aria-label="Dismiss"], .artdeco-notification-badge__dismiss').first();
    if (await dismiss.isVisible()) await dismiss.click({ force: true }).catch(() => {});

    const discoveredEmails = new Set(readEmailQueue());
    ensureDataDir();
    this.stats.totalEmails = discoveredEmails.size;

    let lastProcessedIndex = 0;

    for (let i = 0; i < MAX_CYCLES; i++) {
      if (this.stopping) return;

      this.stats.cycles = i + 1;
      this.log(`Cycle ${i + 1}/${MAX_CYCLES}`);

      const posts = page.locator('div[data-testid="lazy-column"] > div div[role="listitem"]');
      const count = await posts.count();

      let newInCycle = 0;

      for (let j = lastProcessedIndex; j < count; j++) {
        if (this.stopping) return;
        const post = posts.nth(j);

        let text = "";
        try {
          const btn = post.locator('[data-testid="expandable-text-button"]');
          if ((await btn.count()) > 0 && (await btn.isVisible())) {
            await btn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(300);
          }
          text = await post.innerText({ timeout: 5000 });
        } catch (e) { continue; }

        const matches = text.match(EMAIL_REGEX);
        if (matches) {
          for (const email of matches) {
            if (!discoveredEmails.has(email) && !email.includes("example.com") && !sentEmailManager.isAlreadySent(email)) {
              this.log(`[FOUND] ${email}`);
              discoveredEmails.add(email);
              newInCycle++;
              this.stats.newEmails++;
              this.stats.totalEmails++;
              appendToQueue(email);
            }
          }
        }
      }

      if (newInCycle > 0) this.log(`Found ${newInCycle} new emails`);
      lastProcessedIndex = count;

      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(4000);
    }

    this.log(`Scraping complete. Found ${this.stats.newEmails} new emails (${this.stats.totalEmails} total in queue).`);
  }

  getStatus() {
    return { status: this.status, stats: { ...this.stats } };
  }
}

module.exports = new ScraperService();
