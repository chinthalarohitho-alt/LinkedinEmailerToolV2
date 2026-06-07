const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { loadSettings, saveSettings, loadTemplate, ensureDataDir, discoverResume, DATA_DIR, TEMPLATE_FILE } = require("../lib/config");

const uploadDir = path.join(DATA_DIR, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.get("/", (req, res) => {
  res.json(loadSettings());
});

router.put("/", (req, res) => {
  const updated = { ...loadSettings(), ...req.body };
  saveSettings(updated);
  res.json(updated);
});

router.get("/template", (req, res) => {
  res.json({ template: loadTemplate() });
});

router.put("/template", (req, res) => {
  ensureDataDir();
  fs.writeFileSync(TEMPLATE_FILE, req.body.template);
  res.json({ message: "Template saved" });
});

router.post("/resume", upload.single("resume"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const ext = path.extname(req.file.originalname) || ".pdf";
  const dest = path.join(DATA_DIR, `resume${ext}`);
  fs.renameSync(req.file.path, dest);
  res.json({ message: "Resume uploaded", filename: `resume${ext}` });
});

router.get("/resume", async (req, res) => {
  const resumePath = discoverResume();
  try {
    const stat = fs.statSync(resumePath);
    const filename = path.basename(resumePath);
    return res.json({ exists: true, filename, size: stat.size });
  } catch (e) {
    return res.json({ exists: false });
  }
});

// AI template generation using Pollinations.ai (free, no API key)
router.post("/generate-template", async (req, res) => {
  const settings = loadSettings();
  const { searchRole, linkedinUrl, phoneNumber, phoneCode } = { ...settings, ...req.body };

  let resumeText = "";
  try {
    const resumePath = discoverResume();
    const buffer = new Uint8Array(fs.readFileSync(resumePath));
    const pdf = new PDFParse(buffer);
    const result = await pdf.getText();
    resumeText = result.pages.map((p) => p.text).join("\n").slice(0, 2000);
  } catch (e) {
    return res.status(400).json({ error: "Could not read resume. Please upload a PDF in Settings." });
  }

  const fullPhone = phoneNumber ? `${phoneCode || "+91"} ${phoneNumber}` : "";
  const fullLinkedIn = linkedinUrl ? `https://linkedin.com/in/${linkedinUrl}` : "";
  const role = searchRole || "Software role";

  const prompt = `Write a cold application email for the role: "${role}".

Rules:
- Start with "Dear Hiring Team," (generic greeting that works for all recruiters)
- Keep it 80-120 words, concise and confident
- Pick only 3-4 skills from the resume that are MOST relevant to "${role}" and weave them naturally into sentences — do NOT list them with commas or bullet points, do NOT bold or format them with ** or markdown
- Mention a specific measurable achievement from the resume if available
- Do NOT mention skills irrelevant to "${role}"
- End with applicant's name from the resume, then phone and LinkedIn on separate lines
- Structure: exactly 2 short paragraphs — first about relevant skills/experience, second about interest and value you bring
- Tone: professional, direct, no filler phrases like "I believe" or "I am confident"
${fullPhone ? `- Sign off phone: ${fullPhone}` : ""}
${fullLinkedIn ? `- Sign off LinkedIn: ${fullLinkedIn}` : ""}

Resume:
${resumeText}

Return ONLY valid JSON, no markdown, no code fences:
{"subject": "Application – ${role}", "body": "the plain text email body"}`;

  const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY;

  try {
    let text = "";

    if (geminiKey) {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 },
          }),
        });
        if (response.status === 429 || response.status === 503) continue;
        if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        break;
      }
    } else {
      // Fallback: Pollinations (free, no key, but rate limited)
      const payload = JSON.stringify({
        messages: [
          { role: "system", content: "You are a professional email writer. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        model: "openai",
        seed: Math.floor(Math.random() * 10000),
      });

      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 5000));
        const response = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (response.status === 429 || response.status === 502 || response.status === 503) continue;
        if (!response.ok) throw new Error(`AI service error: ${response.status}`);
        text = await response.text();
        break;
      }
    }

    if (!text) throw new Error("AI service is busy. Please try again in a moment.");

    const jsonMatch = text.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid format. Please try again.");

    const result = JSON.parse(jsonMatch[0]);
    if (!result.subject || !result.body) throw new Error("AI response incomplete. Please try again.");

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
