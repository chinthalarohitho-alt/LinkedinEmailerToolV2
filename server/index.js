const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use("/api/scrape", require("./routes/scraper"));
app.use("/api/emails", require("./routes/emails"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/cron", require("./routes/cron"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const clientBuild = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuild));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientBuild, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
