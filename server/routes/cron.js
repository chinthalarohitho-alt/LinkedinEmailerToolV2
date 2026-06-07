const express = require("express");
const router = express.Router();
const cronService = require("../services/CronService");

router.get("/", (req, res) => {
  res.json(cronService.getStatus());
});

router.put("/", (req, res) => {
  cronService.update(req.body);
  res.json(cronService.getStatus());
});

router.post("/run", (req, res) => {
  cronService.runNow();
  res.json({ message: "Cron job triggered manually" });
});

module.exports = router;
