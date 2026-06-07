const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../Data");
const EMAILS_FILE = path.join(DATA_DIR, "Emails.txt");
const TEMPLATE_FILE = path.join(DATA_DIR, "EmailTemplate.txt");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const SENT_EMAILS_FILE = path.join(DATA_DIR, "SentEmails.json");
const CRON_FILE = path.join(DATA_DIR, "cron.json");
const CHROME_PROFILE_DIR = path.join(DATA_DIR, "ChromeProfile");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSettings() {
  const defaults = {
    searchRole: process.env.LINKEDIN_SEARCH_ROLE || "QA role",
    emailSubject: process.env.EMAIL_SUBJECT || "Application - QA / Software Testing Role",
    emailUser: process.env.EMAIL_USER || "",
    emailPass: process.env.EMAIL_PASS || "",
    autoSendAfterScrape: true,
    geminiKey: "",
    linkedinUrl: "",
    phoneNumber: "",
    phoneCode: "+91",
  };
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) };
  } catch (e) {
    return defaults;
  }
}

function saveSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function readEmailQueue() {
  try {
    return [...new Set(
      fs.readFileSync(EMAILS_FILE, "utf-8").split("\n").map((e) => e.trim()).filter(Boolean)
    )];
  } catch (e) {
    return [];
  }
}

function removeFromQueue(email) {
  try {
    const lines = fs.readFileSync(EMAILS_FILE, "utf-8").split("\n");
    fs.writeFileSync(EMAILS_FILE, lines.filter((l) => l.trim() !== email).join("\n"));
  } catch (e) {}
}

function removeMultipleFromQueue(emails) {
  try {
    const toRemove = new Set(emails);
    const lines = fs.readFileSync(EMAILS_FILE, "utf-8").split("\n");
    fs.writeFileSync(EMAILS_FILE, lines.filter((l) => !toRemove.has(l.trim())).join("\n"));
  } catch (e) {}
}

function appendToQueue(email) {
  ensureDataDir();
  fs.appendFileSync(EMAILS_FILE, `${email}\n`);
}

function loadTemplate() {
  try {
    return fs.readFileSync(TEMPLATE_FILE, "utf-8");
  } catch (e) {
    return (process.env.EMAIL_BODY || "").replace(/\\n/g, "\n");
  }
}

function discoverResume() {
  let resumePath = path.join(DATA_DIR, "sdet.pdf");
  try {
    const files = fs.readdirSync(DATA_DIR);
    const match = files.find((f) => /resume\.pdf$/i.test(f));
    if (match) resumePath = path.join(DATA_DIR, match);
  } catch (e) {}
  return resumePath;
}

module.exports = {
  DATA_DIR, EMAILS_FILE, TEMPLATE_FILE, SETTINGS_FILE, SENT_EMAILS_FILE, CRON_FILE, CHROME_PROFILE_DIR,
  ensureDataDir, loadSettings, saveSettings, readEmailQueue, removeFromQueue, removeMultipleFromQueue, appendToQueue,
  loadTemplate, discoverResume,
};
