const express = require("express");
const router = express.Router();
const { readEmailQueue, removeFromQueue, appendToQueue } = require("../lib/config");
const emailService = require("../services/EmailService");
const sentEmailManager = require("../../utils/SentEmailManager");

router.get("/", (req, res) => {
  res.json({ emails: readEmailQueue() });
});

router.post("/add", (req, res) => {
  const { emails } = req.body;
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Provide an array of emails" });
  }
  const existing = new Set(readEmailQueue());
  const added = [];
  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !existing.has(trimmed)) {
      appendToQueue(trimmed);
      existing.add(trimmed);
      added.push(trimmed);
    }
  }
  res.json({ added: added.length, emails: added });
});

router.delete("/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  removeFromQueue(email);
  res.json({ message: `Removed ${email}` });
});

router.post("/send", async (req, res) => {
  if (emailService.sending) return res.status(409).json({ error: "Already sending" });

  const logs = [];
  const onLog = (msg) => logs.push(msg);
  emailService.on("log", onLog);

  try {
    const results = await emailService.sendAll();
    emailService.off("log", onLog);
    res.json({ ...results, logs });
  } catch (err) {
    emailService.off("log", onLog);
    res.status(500).json({ error: err.message, logs });
  }
});

router.get("/sent", (req, res) => {
  try {
    res.json({ sent: sentEmailManager.getSentList() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
