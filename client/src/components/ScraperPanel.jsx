import { useState, useEffect, useRef, useCallback } from "react";
import Toast from "./Toast";

const MAX_LOGS = 500;

export default function ScraperPanel() {
  const [status, setStatus] = useState("idle");
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ searchRole: "QA role" });
  const [message, setMessage] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  const addLog = useCallback((msg) => {
    setLogs((prev) => { const n = [...prev, msg]; return n.length > MAX_LOGS ? n.slice(-MAX_LOGS) : n; });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});
    fetch("/api/scrape/status").then((r) => r.json()).then((d) => { setStatus(d.status); setStats(d.stats); }).catch(() => {});
    connectSSE();
    return () => { mountedRef.current = false; if (eventSourceRef.current) eventSourceRef.current.close(); if (reconnectRef.current) clearTimeout(reconnectRef.current); };
  }, []);

  const connectSSE = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource("/api/scrape/stream");
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      if (!mountedRef.current) return;
      const data = JSON.parse(event.data);
      if (data.type === "log") addLog(data.message);
      else if (data.type === "status") { setStatus(data.status); setStats(data.stats); }
    };
    es.onerror = () => { es.close(); if (mountedRef.current) reconnectRef.current = setTimeout(connectSSE, 3000); };
  };

  const logContainerRef = useRef(null);
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleStart = async () => {
    const missing = [];
    if (!settings.searchRole) missing.push("Search Role");
    if (!settings.emailUser) missing.push("Gmail Address");
    if (!settings.emailPass) missing.push("App Password");
    if (!settings.emailSubject) missing.push("Email Subject");
    if (missing.length > 0) {
      setMessage({ type: "error", text: `Please fill in Settings: ${missing.join(", ")}` });
      return;
    }
    setLogs([]);
    try {
      const res = await fetch("/api/scrape/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchRole: settings.searchRole }) });
      const data = await res.json();
      if (res.ok) setStatus("running"); else addLog(`Error: ${data.error}`);
    } catch (err) { addLog(`Error: ${err.message}`); }
  };

  const handleViewEmails = async () => {
    try {
      const data = await fetch("/api/emails").then((r) => r.json());
      const emails = data.emails || [];
      const t = new Date().toLocaleTimeString();
      if (emails.length === 0) addLog(`[${t}] No emails in queue.`);
      else { addLog(`[${t}] --- Scraped Emails (${emails.length}) ---`); emails.forEach((e, i) => addLog(`  ${i + 1}. ${e}`)); addLog(`[${t}] --- End of list ---`); }
    } catch (err) { addLog(`Error: ${err.message}`); }
  };

  const handleSendOnly = async () => {
    addLog(`[${new Date().toLocaleTimeString()}] Sending emails only...`);
    try {
      const res = await fetch("/api/emails/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) { if (data.logs) data.logs.forEach((l) => addLog(l)); addLog(`[${new Date().toLocaleTimeString()}] Done. Sent: ${data.sent}, Failed: ${data.failed}`); }
      else addLog(`Error: ${data.error}`);
    } catch (err) { addLog(`Error: ${err.message}`); }
  };

  const handleStop = async () => {
    try { await fetch("/api/scrape/stop", { method: "POST" }); setStatus("idle"); }
    catch (err) { addLog(`Error: ${err.message}`); }
  };

  const getLogClass = (line) => {
    if (line.includes("[FOUND]")) return "log-line found";
    if (line.includes("Error") || line.includes("FAILED")) return "log-line error";
    if (line.includes("SUCCESS") || line.includes("complete")) return "log-line success";
    return "log-line";
  };

  const statusLabel = { idle: "Idle", running: "Running", sending: "Sending Emails", done: "Complete", error: "Error" };

  return (
    <div>
      <Toast message={message} onClear={() => setMessage(null)} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "8px 18px", fontSize: "0.88rem", fontWeight: 600, color: "#fff",
        }}>
          <span style={{ opacity: 0.5 }}>&#128187;</span> Live Scraping Logs
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {status !== "running"
              ? <button className="btn btn-primary btn-sm" onClick={handleStart}>Start Scraping</button>
              : <button className="btn btn-danger btn-sm" onClick={handleStop}>Stop Scraping</button>}
            <button className="btn btn-sm" onClick={handleViewEmails}>View Emails</button>
            <button className="btn btn-success btn-sm" onClick={handleSendOnly} disabled={status === "running" || settings.autoSendAfterScrape}>
              Send Emails{settings.autoSendAfterScrape ? " (Auto)" : ""}
            </button>
            <span style={{ color: "#6b7280", fontSize: "0.78rem", cursor: "pointer" }} onClick={() => setLogs([])}>Clear Logs</span>
          </div>
      </div>

      <div className="panel">
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>New: <strong style={{ color: "#fff" }}>{stats.newEmails || 0}</strong></span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Queue: <strong style={{ color: "#fff" }}>{(stats.totalEmails || 0).toLocaleString()}</strong></span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Cycles: <strong style={{ color: "#fff" }}>{stats.cycles || 0}/25</strong></span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Status: <strong style={{ color: "#fff" }}>{statusLabel[status]}</strong><span className={`status-dot ${status}`}></span></span>
        </div>

        {(status === "running" || status === "sending") && (
          <div style={{ height: 4, borderRadius: 2, background: status === "sending" ? "rgba(96,165,250,0.1)" : "rgba(34,197,94,0.1)", overflow: "hidden", marginBottom: 8 }}>
            {status === "running" ? (
              <div style={{
                height: "100%", borderRadius: 2,
                background: "linear-gradient(90deg, #22c55e, #16a34a)",
                width: `${((stats.cycles || 0) / 25) * 100}%`,
                transition: "width 0.5s ease",
              }} />
            ) : (
              <div style={{
                height: "100%", width: "40%", borderRadius: 2,
                background: "linear-gradient(90deg, #60a5fa, #2563eb)",
                animation: "loadingBar 1.2s ease-in-out infinite",
              }} />
            )}
          </div>
        )}

        <div className="log-viewer" ref={logContainerRef}>
          {logs.length === 0
            ? <div style={{ fontStyle: "italic" }}>No logs yet. Click "Start Scraping" to begin.</div>
            : logs.map((line, i) => <div key={i} className={getLogClass(line)}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}
