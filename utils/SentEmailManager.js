const fs = require("fs");
const { SENT_EMAILS_FILE, ensureDataDir } = require("../server/lib/config");

const EXPIRY_MS = 96 * 60 * 60 * 1000; // 96 hours

class SentEmailManager {
  constructor() {
    this.cache = null;
  }

  _load() {
    if (this.cache) return this.cache;
    try {
      this.cache = JSON.parse(fs.readFileSync(SENT_EMAILS_FILE, "utf-8"));
    } catch (e) {
      this.cache = {};
    }
    return this.cache;
  }

  _save() {
    try {
      ensureDataDir();
      fs.writeFileSync(SENT_EMAILS_FILE, JSON.stringify(this.cache, null, 2));
    } catch (e) {}
  }

  addEmail(email) {
    this._load();
    this.cache[email] = Date.now();
    this._save();
  }

  addEmails(emails) {
    this._load();
    const now = Date.now();
    for (const email of emails) this.cache[email] = now;
    this._save();
  }

  isAlreadySent(email) {
    const data = this._load();
    if (!data[email]) return false;
    if (Date.now() - data[email] > EXPIRY_MS) {
      delete this.cache[email];
      return false;
    }
    return true;
  }

  getSentList() {
    const data = this._load();
    return Object.entries(data)
      .map(([email, timestamp]) => ({ email, sentAt: new Date(timestamp).toISOString(), timestamp }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  cleanup() {
    const data = this._load();
    const now = Date.now();
    let changed = false;
    for (const [email, timestamp] of Object.entries(data)) {
      if (now - timestamp > EXPIRY_MS) {
        delete data[email];
        changed = true;
      }
    }
    if (changed) this._save();
  }
}

module.exports = new SentEmailManager();
