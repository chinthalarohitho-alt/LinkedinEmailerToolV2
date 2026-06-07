import { useState, useEffect, useRef } from "react";
import Toast from "./Toast";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildCron({ intervalHours, selectedHours, selectedDays, selectedMonths }) {
  const minute = "0";
  const hour = intervalHours ? `*/${intervalHours}` : (selectedHours.length > 0 ? selectedHours.join(",") : "*");
  const dom = "*";
  const month = selectedMonths.length > 0 && selectedMonths.length < 12
    ? selectedMonths.map((m) => m + 1).join(",") : "*";
  const dow = selectedDays.length > 0 && selectedDays.length < 7
    ? selectedDays.join(",") : "*";
  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}

export default function CronPanel() {
  const [config, setConfig] = useState({ enabled: false, schedule: "0 */6 * * *", autoSend: true });
  const [status, setStatus] = useState({ running: false, lastRun: null, nextRun: null, logs: [] });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState("interval");
  const [intervalHours, setIntervalHours] = useState(6);
  const [selectedHours, setSelectedHours] = useState([9]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const loadedRef = useRef(false);
  const userChangedRef = useRef(false);

  const parseCron = (expr) => {
    const parts = (expr || "0 */6 * * *").split(" ");
    const hourPart = parts[1] || "*";
    const monthPart = parts[3] || "*";
    const dowPart = parts[4] || "*";

    if (hourPart.startsWith("*/")) {
      setMode("interval");
      setIntervalHours(parseInt(hourPart.replace("*/", "")) || 6);
    } else if (hourPart !== "*") {
      setMode("specific");
      setSelectedHours(hourPart.split(",").map(Number));
    } else {
      setMode("interval");
      setIntervalHours(1);
    }

    if (dowPart !== "*") setSelectedDays(dowPart.split(",").map(Number));
    else setSelectedDays([]);

    if (monthPart !== "*") setSelectedMonths(monthPart.split(",").map((m) => parseInt(m) - 1));
    else setSelectedMonths([]);
  };

  const fetchStatus = async () => {
    try {
      const data = await fetch("/api/cron").then((r) => r.json());
      setConfig({ enabled: data.enabled, schedule: data.schedule, autoSend: data.autoSend });
      setStatus({ running: data.running, lastRun: data.lastRun, nextRun: data.nextRun, logs: data.logs || [] });

      if (!loadedRef.current && data.schedule) {
        parseCron(data.schedule);
        loadedRef.current = true;
        setTimeout(() => { userChangedRef.current = true; }, 500);
      }
    } catch (e) {}
  };

  useEffect(() => { fetchStatus(); const id = setInterval(fetchStatus, 10000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (!userChangedRef.current) return;
    const expr = mode === "interval"
      ? buildCron({ intervalHours, selectedDays, selectedMonths })
      : buildCron({ selectedHours, selectedDays, selectedMonths });
    setConfig((c) => ({ ...c, schedule: expr }));
  }, [mode, intervalHours, selectedHours, selectedDays, selectedMonths]);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch("/api/cron", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setMessage({ type: "success", text: config.enabled ? "Cron job activated!" : "Cron job disabled." });
        fetchStatus();
      }
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  const handleRunNow = async () => {
    await fetch("/api/cron/run", { method: "POST" });
    setMessage({ type: "success", text: "Manual run triggered!" });
    setTimeout(fetchStatus, 2000);
  };

  const describeCron = (expr) => {
    const parts = (expr || "").split(" ");
    if (parts.length < 5) return "";
    const hour = parts[1], dow = parts[4], month = parts[3];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let text = "";
    if (hour.startsWith("*/")) text = `Every ${hour.replace("*/", "")} hour(s)`;
    else if (hour === "*") text = "Every hour";
    else text = `At ${hour.split(",").map((h) => `${h}:00`).join(", ")}`;

    if (dow !== "*") text += ` on ${dow.split(",").map((d) => dayNames[+d] || d).join(", ")}`;
    if (month !== "*") text += ` in ${month.split(",").map((m) => monthNames[+m - 1] || m).join(", ")}`;
    return text;
  };

  const toggleInArray = (arr, val) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  const formatDate = (iso) => iso ? new Date(iso).toLocaleString("en-US", { hour12: true }) : "Never";

  const chipStyle = (active) => ({
    padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
    border: `1px solid ${active ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.08)"}`,
    background: active ? "rgba(37,99,235,0.12)" : "transparent",
    color: active ? "#60a5fa" : "#6b7280",
    transition: "all 0.15s",
  });

  return (
    <div>
      <Toast message={message} onClear={() => setMessage(null)} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: "0.78rem", color: "#6b7280" }}>
          <span>Status: <strong style={{ color: config.enabled ? "#22c55e" : "#6b7280" }}>{config.enabled ? "Active" : "Disabled"}</strong>
            <span className={`status-dot ${config.enabled ? "running" : "idle"}`}></span>
          </span>
          <span>Last: <strong style={{ color: "#fff" }}>{formatDate(status.lastRun)}</strong></span>
          <span>Next: <strong style={{ color: "#fff" }}>{config.enabled ? formatDate(status.nextRun) : "---"}</strong></span>
          {config.enabled && <span><code style={{ color: "#60a5fa", fontSize: "0.75rem" }}>{config.schedule}</code> — {describeCron(config.schedule)}</span>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-sm" onClick={handleRunNow}>&#9654; Run Now</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            &#128190; {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginBottom: 18 }}>Schedule Builder</div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "#c8cdd5" }}>
                <input type="checkbox" checked={config.enabled}
                  onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                Enable Cron Job
              </label>
            </div>

            <div className="form-group">
              <label>Timing Mode</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={chipStyle(mode === "interval")} onClick={() => setMode("interval")}>Every X hours</span>
                <span style={chipStyle(mode === "specific")} onClick={() => setMode("specific")}>Specific hours</span>
              </div>
            </div>

            {mode === "interval" ? (
              <div className="form-group">
                <label>Run every</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {[1, 2, 3, 4, 6, 8, 12].map((h) => (
                    <span key={h} style={chipStyle(intervalHours === h)} onClick={() => setIntervalHours(h)}>
                      {h}h
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Run at these hours</label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {HOURS.map((h) => (
                    <span key={h} style={{ ...chipStyle(selectedHours.includes(h)), padding: "5px 8px", fontSize: "0.72rem", minWidth: 36, textAlign: "center" }}
                      onClick={() => setSelectedHours(toggleInArray(selectedHours, h))}>
                      {h.toString().padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Days of week <span style={{ color: "#555", fontWeight: 400 }}>(empty = every day)</span></label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {DAYS_OF_WEEK.map((d, i) => (
                  <span key={d} style={chipStyle(selectedDays.includes(i))} onClick={() => setSelectedDays(toggleInArray(selectedDays, i))}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Months <span style={{ color: "#555", fontWeight: 400 }}>(empty = every month)</span></label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {MONTHS.map((m, i) => (
                  <span key={m} style={chipStyle(selectedMonths.includes(i))} onClick={() => setSelectedMonths(toggleInArray(selectedMonths, i))}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label>Generated Cron Expression</label>
              <input type="text" value={config.schedule} readOnly
                style={{ fontFamily: "'SF Mono', monospace", color: "#60a5fa", background: "rgba(37,99,235,0.06)" }} />
              <div className="hint">Format: minute hour day month weekday</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginBottom: 18 }}>Options & Activity</div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "#c8cdd5" }}>
                <input type="checkbox" checked={config.autoSend}
                  onChange={(e) => setConfig((c) => ({ ...c, autoSend: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#22c55e" }} />
                Auto-send emails after scraping
              </label>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "#6b7280", marginBottom: 8, display: "block" }}>Recent Activity</label>
              <div className="log-viewer" style={{ height: 360 }}>
                {status.logs.length === 0
                  ? <div style={{ fontStyle: "italic" }}>No cron activity yet.</div>
                  : status.logs.map((line, i) => <div key={i} className="log-line">{line}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
