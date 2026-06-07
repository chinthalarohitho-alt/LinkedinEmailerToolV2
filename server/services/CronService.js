const cron = require("node-cron");
const fs = require("fs");
const scraperService = require("./ScraperService");
const emailService = require("./EmailService");
const { CRON_FILE, ensureDataDir } = require("../lib/config");

class CronService {
  constructor() {
    this.task = null;
    this.config = this._load();
    this.lastRun = null;
    this.nextRun = null;
    this.logs = [];

    if (this.config.enabled && this.config.schedule) {
      this._start();
    }
  }

  _log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.logs.push(line);
    if (this.logs.length > 100) this.logs = this.logs.slice(-100);
  }

  _load() {
    try {
      return JSON.parse(fs.readFileSync(CRON_FILE, "utf-8"));
    } catch (e) {
      return { enabled: false, schedule: "0 */6 * * *", autoSend: true };
    }
  }

  _save() {
    ensureDataDir();
    fs.writeFileSync(CRON_FILE, JSON.stringify(this.config, null, 2));
  }

  _start() {
    if (this.task) this.task.stop();

    if (!cron.validate(this.config.schedule)) {
      this._log(`Invalid cron schedule: ${this.config.schedule}`);
      return;
    }

    this._log(`Cron started: ${this.config.schedule}`);
    this.task = cron.schedule(this.config.schedule, () => this._run());
    this._updateNextRun();
  }

  _stop() {
    if (this.task) { this.task.stop(); this.task = null; }
    this.nextRun = null;
    this._log("Cron stopped.");
  }

  _updateNextRun() {
    const now = new Date();
    const parts = this.config.schedule.split(" ");
    if (parts[1]?.startsWith("*/")) {
      const hours = parseInt(parts[1].replace("*/", ""));
      const next = new Date(now);
      next.setHours(next.getHours() + hours);
      next.setMinutes(0, 0, 0);
      this.nextRun = next.toISOString();
    } else {
      this.nextRun = null;
    }
  }

  async _run() {
    if (scraperService.status === "running" || emailService.sending) {
      this._log("Skipped: scraper or email sender already running.");
      return;
    }

    this._log("Cron triggered: starting scrape...");
    this.lastRun = new Date().toISOString();

    try {
      await scraperService.start({});
      this._log(`Scrape done. Found ${scraperService.stats.newEmails} new emails.`);

      if (this.config.autoSend) {
        this._log("Auto-sending emails...");
        const results = await emailService.sendAll();
        this._log(`Emails sent: ${results.sent}, failed: ${results.failed}`);
      }
    } catch (err) {
      this._log(`Cron error: ${err.message}`);
    }

    this._updateNextRun();
  }

  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._save();

    if (this.config.enabled) {
      this._start();
    } else {
      this._stop();
    }
  }

  getStatus() {
    return {
      ...this.config,
      running: !!this.task,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      logs: this.logs.slice(-20),
    };
  }

  runNow() {
    this._run();
  }
}

module.exports = new CronService();
