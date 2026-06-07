import { useState, useEffect, useRef } from "react";
import Toast from "./Toast";

const COUNTRY_CODES = [
  ["+93","AF"],["+355","AL"],["+213","DZ"],["+376","AD"],["+244","AO"],["+54","AR"],["+374","AM"],["+61","AU"],
  ["+43","AT"],["+994","AZ"],["+973","BH"],["+880","BD"],["+375","BY"],["+32","BE"],["+501","BZ"],["+229","BJ"],
  ["+975","BT"],["+591","BO"],["+387","BA"],["+267","BW"],["+55","BR"],["+673","BN"],["+359","BG"],["+226","BF"],
  ["+257","BI"],["+855","KH"],["+237","CM"],["+1","US"],["+238","CV"],["+236","CF"],["+235","TD"],["+56","CL"],
  ["+86","CN"],["+57","CO"],["+269","KM"],["+242","CG"],["+506","CR"],["+385","HR"],["+53","CU"],["+357","CY"],
  ["+420","CZ"],["+45","DK"],["+253","DJ"],["+593","EC"],["+20","EG"],["+503","SV"],["+240","GQ"],["+291","ER"],
  ["+372","EE"],["+251","ET"],["+679","FJ"],["+358","FI"],["+33","FR"],["+241","GA"],["+220","GM"],["+995","GE"],
  ["+49","DE"],["+233","GH"],["+30","GR"],["+502","GT"],["+224","GN"],["+592","GY"],["+509","HT"],["+504","HN"],
  ["+852","HK"],["+36","HU"],["+354","IS"],["+91","IN"],["+62","ID"],["+98","IR"],["+964","IQ"],["+353","IE"],
  ["+972","IL"],["+39","IT"],["+1876","JM"],["+81","JP"],["+962","JO"],["+7","KZ"],["+254","KE"],["+965","KW"],
  ["+996","KG"],["+856","LA"],["+371","LV"],["+961","LB"],["+266","LS"],["+231","LR"],["+218","LY"],["+423","LI"],
  ["+370","LT"],["+352","LU"],["+853","MO"],["+261","MG"],["+265","MW"],["+60","MY"],["+960","MV"],["+223","ML"],
  ["+356","MT"],["+222","MR"],["+230","MU"],["+52","MX"],["+373","MD"],["+377","MC"],["+976","MN"],["+382","ME"],
  ["+212","MA"],["+258","MZ"],["+95","MM"],["+264","NA"],["+977","NP"],["+31","NL"],["+64","NZ"],["+505","NI"],
  ["+227","NE"],["+234","NG"],["+850","KP"],["+389","MK"],["+47","NO"],["+968","OM"],["+92","PK"],["+507","PA"],
  ["+675","PG"],["+595","PY"],["+51","PE"],["+63","PH"],["+48","PL"],["+351","PT"],["+974","QA"],["+40","RO"],
  ["+7","RU"],["+250","RW"],["+966","SA"],["+221","SN"],["+381","RS"],["+65","SG"],["+421","SK"],["+386","SI"],
  ["+27","ZA"],["+82","KR"],["+34","ES"],["+94","LK"],["+249","SD"],["+46","SE"],["+41","CH"],["+963","SY"],
  ["+886","TW"],["+992","TJ"],["+255","TZ"],["+66","TH"],["+228","TG"],["+216","TN"],["+90","TR"],["+993","TM"],
  ["+256","UG"],["+380","UA"],["+971","AE"],["+44","GB"],["+598","UY"],["+998","UZ"],["+58","VE"],["+84","VN"],
  ["+967","YE"],["+260","ZM"],["+263","ZW"]
];

function PhoneCodeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = COUNTRY_CODES.find(([code]) => code === value) || ["+91", "IN"];
  const filtered = search
    ? COUNTRY_CODES.filter(([code, country]) =>
        country.toLowerCase().includes(search.toLowerCase()) || code.includes(search))
    : COUNTRY_CODES;

  return (
    <div ref={ref} style={{ position: "relative", width: 90 }}>
      <div onClick={() => setOpen(!open)}
        style={{
          padding: "11px 10px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, color: "#c8cdd5", fontSize: "0.82rem", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center", whiteSpace: "nowrap",
        }}>
        <span>{current[1]} {current[0]}</span>
        <span style={{ color: "#555", fontSize: "0.6rem", marginLeft: 4 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0, width: 200, zIndex: 50,
          background: "#151820", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)", maxHeight: 260, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." autoFocus
              style={{
                width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                color: "#c8cdd5", fontSize: "0.78rem", outline: "none",
              }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 200, padding: "4px 0" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "8px 12px", color: "#555", fontSize: "0.78rem" }}>No matches</div>
            ) : (
              filtered.map(([code, country]) => (
                <div key={code + country}
                  onClick={() => { onChange(code); setOpen(false); setSearch(""); }}
                  style={{
                    padding: "7px 12px", cursor: "pointer", fontSize: "0.8rem",
                    color: value === code ? "#60a5fa" : "#c8cdd5",
                    background: value === code ? "rgba(37,99,235,0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={(e) => e.target.style.background = value === code ? "rgba(37,99,235,0.08)" : "transparent"}>
                  {country} {code}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ROLE_GROUPS = {
  "QA & Testing": ["QA role", "SDET", "Software Tester", "QA Engineer", "QA Analyst", "Automation Tester", "Manual Tester", "Test Engineer", "Performance Tester", "QA Lead"],
  "Development": ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "React Developer", "Node.js Developer", "Python Developer", "Java Developer", ".NET Developer", "Angular Developer", "iOS Developer", "Android Developer", "Mobile Developer", "Golang Developer", "Rust Developer", "PHP Developer"],
  "DevOps & Cloud": ["DevOps Engineer", "SRE", "Cloud Engineer", "AWS Engineer", "Azure Engineer", "Platform Engineer"],
  "Data & AI": ["Data Analyst", "Data Engineer", "Data Scientist", "ML Engineer", "AI Engineer", "BI Analyst"],
  "Product & Design": ["Product Manager", "Product Owner", "Business Analyst", "Scrum Master", "Project Manager", "UI/UX Designer", "UX Researcher", "Product Designer"],
  "Security & Infra": ["Security Engineer", "Cybersecurity Analyst", "Network Engineer", "System Administrator"],
  "Leadership": ["Technical Writer", "Solutions Architect", "Engineering Manager", "Tech Lead", "CTO"],
};

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allRoles = Object.values(ROLE_GROUPS).flat();
  const filtered = search
    ? allRoles.filter((r) => r.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)}
        style={{
          padding: "11px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, color: "#c8cdd5", fontSize: "0.85rem", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
        <span>{value || "Select a role..."}</span>
        <span style={{ color: "#555", fontSize: "0.7rem" }}>{open ? "\u25B2" : "\u25BC"}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#151820", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)", maxHeight: 360, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..." autoFocus
              style={{
                width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                color: "#c8cdd5", fontSize: "0.82rem", outline: "none",
              }} />
          </div>

          <div style={{ overflowY: "auto", maxHeight: 300, padding: "6px 0" }}>
            {filtered ? (
              filtered.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "#555", fontSize: "0.82rem" }}>No matches</div>
              ) : (
                filtered.map((role) => (
                  <div key={role} onClick={() => { onChange(role); setOpen(false); setSearch(""); }}
                    style={{
                      padding: "9px 16px", cursor: "pointer", fontSize: "0.84rem",
                      color: value === role ? "#60a5fa" : "#c8cdd5",
                      background: value === role ? "rgba(37,99,235,0.08)" : "transparent",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={(e) => e.target.style.background = value === role ? "rgba(37,99,235,0.08)" : "transparent"}>
                    {role}
                  </div>
                ))
              )
            ) : (
              Object.entries(ROLE_GROUPS).map(([group, roles]) => (
                <div key={group}>
                  <div style={{
                    padding: "8px 16px 4px", fontSize: "0.68rem", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: "#555",
                  }}>{group}</div>
                  {roles.map((role) => (
                    <div key={role} onClick={() => { onChange(role); setOpen(false); setSearch(""); }}
                      style={{
                        padding: "8px 16px 8px 24px", cursor: "pointer", fontSize: "0.84rem",
                        color: value === role ? "#60a5fa" : "#c8cdd5",
                        background: value === role ? "rgba(37,99,235,0.08)" : "transparent",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={(e) => e.target.style.background = value === role ? "rgba(37,99,235,0.08)" : "transparent"}>
                      {role}
                    </div>
                  ))}
                </div>
              ))
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
            <div onClick={() => { setOpen(false); }}
              style={{ padding: "9px 16px", cursor: "pointer", fontSize: "0.84rem", color: "#6b7280", fontStyle: "italic" }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}>
              Or type a custom role in the search box above
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    searchRole: "", emailSubject: "", emailUser: "", emailPass: "",
    autoSendAfterScrape: true, geminiKey: "", linkedinUrl: "", phoneNumber: "", phoneCode: "+91",
  });
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const fileInputRef = useRef(null);

  const safeFetchJson = (url) => fetch(url).then((r) => {
    if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) throw new Error("Not JSON");
    return r.json();
  });

  useEffect(() => {
    Promise.all([
      safeFetchJson("/api/settings"),
      safeFetchJson("/api/settings/template"),
    ]).then(([s, t]) => {
      setSettings(s);
      setTemplate(t.template || "");
    }).catch(() => setMessage({ type: "error", text: "Failed to load settings. Is the backend running?" }));

    safeFetchJson("/api/settings/resume").then(setResumeInfo).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!settings.emailUser || !settings.emailPass) {
      setMessage({ type: "error", text: "Gmail address and App Password are required." });
      return;
    }
    if (!settings.searchRole) {
      setMessage({ type: "error", text: "Please select a search role." });
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }),
        fetch("/api/settings/template", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template }) }),
      ]);
      setMessage({ type: sRes.ok && tRes.ok ? "success" : "error", text: sRes.ok && tRes.ok ? "Settings saved!" : "Failed to save" });
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("resume", file);
    try {
      const res = await fetch("/api/settings/resume", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Resume uploaded: ${data.filename}` });
        const r = await fetch("/api/settings/resume").then((r) => r.json());
        setResumeInfo(r);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleGenerate = async () => {
    setGenerating(true); setMessage(null);
    try {
      const res = await fetch("/api/settings/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchRole: settings.searchRole,
          linkedinUrl: settings.linkedinUrl,
          phoneNumber: settings.phoneNumber,
          phoneCode: settings.phoneCode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings((s) => ({ ...s, emailSubject: data.subject }));
        setTemplate(data.body);
        setMessage({ type: "success", text: "AI generated your email template!" });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setGenerating(false); }
  };

  const update = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Configuration</h1>
          <p>Manage your scraper preferences and SMTP credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          &#128190; {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <Toast message={message} onClear={() => setMessage(null)} />

      <div className="settings-grid">
        <div>
          <div className="settings-card">
            <div className="settings-card-title"><span>&#128269;</span> Targeting Parameters</div>
            <div className="form-group">
              <label>Search Role</label>
              <RoleDropdown value={settings.searchRole}
                onChange={(role) => setSettings((s) => ({ ...s, searchRole: role }))} />
            </div>
          </div>

          <div className="settings-card" style={{ marginTop: 20 }}>
            <div className="settings-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><span>&#9993;</span> Email Templates</span>
              <button className="btn btn-sm" onClick={handleGenerate} disabled={generating}
                style={{ fontSize: "0.75rem", padding: "6px 12px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                {generating ? "Generating..." : "\u2728 Generate with AI"}
              </button>
            </div>
            <div className="form-group">
              <label>Gemini API Key — <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 400 }}>Click here to create (free api key)</a></label>
              <div className="input-icon-wrap">
                <input type={showGemini ? "text" : "password"} value={settings.geminiKey} onChange={update("geminiKey")} placeholder="AIza..." style={{ paddingRight: 40 }} />
                <span onClick={() => setShowGemini(!showGemini)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#555", fontSize: "0.7rem", userSelect: "none" }}>
                  {showGemini ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            {generating && (
              <div style={{ height: 3, borderRadius: 2, background: "rgba(139,92,246,0.15)", overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: "40%", background: "linear-gradient(90deg, #a78bfa, #7c3aed)", borderRadius: 2, animation: "loadingBar 1.2s ease-in-out infinite" }} />
              </div>
            )}
            <div className="form-group">
              <label>Email Subject</label>
              <input type="text" value={settings.emailSubject} onChange={update("emailSubject")} placeholder="Application for Role" />
            </div>
            <div className="form-group">
              <label>Email Body</label>
              <textarea value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="Hi [Name], I'm interested in..." rows={8} />
            </div>
            <div className="hint">Pro-tip: Use "Generate with AI" to create a personalized template from your resume.</div>
          </div>
        </div>

        <div>
          <div className="settings-card">
            <div className="settings-card-title"><span>&#128274;</span> Gmail SMTP Credentials</div>
            <div className="form-group">
              <label>Gmail Address</label>
              <div className="input-icon-wrap">
                <span className="input-icon">@</span>
                <input type="email" value={settings.emailUser} onChange={update("emailUser")} placeholder="your.name@gmail.com" />
              </div>
            </div>
            <div className="form-group">
              <label>App Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon">&#128273;</span>
                <input type={showPass ? "text" : "password"} value={settings.emailPass} onChange={update("emailPass")} placeholder="xxxx xxxx xxxx xxxx" style={{ paddingRight: 40 }} />
                <span onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#555", fontSize: "0.7rem", userSelect: "none" }}>
                  {showPass ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <div className="hint-box">
              &#9888; Gmail requires a 16-digit App Password. 2FA must be enabled on your Google account to generate this.
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <span style={{ color: "#c8cdd5", fontSize: "0.85rem" }}>Auto-send emails after scraping</span>
                <input type="checkbox" checked={settings.autoSendAfterScrape}
                  onChange={(e) => setSettings((s) => ({ ...s, autoSendAfterScrape: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#22c55e" }} />
              </label>
            </div>
          </div>

          <div className="settings-card" style={{ marginTop: 20, padding: "28px 24px 32px" }}>
            <div className="settings-card-title"><span>&#128196;</span> Resume & Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 16px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Resume (PDF)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "\u{1F4CE} Upload"}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: "none" }} />
                  {resumeInfo?.exists ? (
                    <span style={{ color: "#22c55e", fontSize: "0.75rem" }}>&#10004; {resumeInfo.filename}</span>
                  ) : resumeInfo ? (
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>No file</span>
                  ) : null}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Phone Number</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <PhoneCodeDropdown value={settings.phoneCode || "+91"}
                    onChange={(code) => setSettings((s) => ({ ...s, phoneCode: code }))} />
                  <input type="tel" value={settings.phoneNumber} onChange={update("phoneNumber")} placeholder="9876543210" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
                <label>LinkedIn Username</label>
                <div className="input-icon-wrap">
                  <span className="input-icon" style={{ left: 14, fontSize: "0.75rem", color: "#555", whiteSpace: "nowrap" }}>linkedin.com/in/</span>
                  <input type="text" value={settings.linkedinUrl} onChange={update("linkedinUrl")} placeholder="your-username" style={{ paddingLeft: 120 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
