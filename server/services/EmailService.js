const nodemailer = require("nodemailer");
const path = require("path");
const EventEmitter = require("events");
const sentEmailManager = require("../../utils/SentEmailManager");
const { loadSettings, readEmailQueue, removeFromQueue, loadTemplate, discoverResume } = require("../lib/config");

class EmailService extends EventEmitter {
  constructor() {
    super();
    this.sending = false;
  }

  log(message) {
    this.emit("log", `[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async sendAll() {
    if (this.sending) throw new Error("Already sending emails");
    this.sending = true;
    const results = { sent: 0, failed: 0, total: 0 };

    try {
      const settings = loadSettings();
      const { emailUser: user, emailPass: pass, emailSubject: subject } = settings;
      if (!user || !pass) throw new Error("Email credentials not configured. Go to Settings.");

      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
      const emails = readEmailQueue();
      results.total = emails.length;

      if (emails.length === 0) { this.log("No emails to send."); return results; }

      const body = loadTemplate();
      const resumePath = discoverResume();
      this.log(`Sending ${emails.length} emails...`);

      for (const email of emails) {
        this.log(`Sending to: ${email}...`);
        try {
          await transporter.sendMail({
            from: user, to: email, subject, text: body,
            attachments: [{ filename: path.basename(resumePath), path: resumePath }],
          });
          this.log(`SUCCESS: Sent to ${email}`);
          results.sent++;
          sentEmailManager.addEmail(email);
          removeFromQueue(email);
        } catch (error) {
          this.log(`FAILED: ${email} - ${error.message}`);
          results.failed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.log(`Done. Sent: ${results.sent}, Failed: ${results.failed}`);
      return results;
    } finally {
      this.sending = false;
    }
  }
}

module.exports = new EmailService();
