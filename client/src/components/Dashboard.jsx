import { useState, useEffect, useRef } from "react";
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";

export default function Dashboard({ onNavigate }) {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [scraperStatus, setScraperStatus] = useState("idle");
  const [filter, setFilter] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [page, setPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const perPage = 10;
  const prevDataRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [e, s, st] = await Promise.all([
        fetch("/api/emails").then((r) => r.json()),
        fetch("/api/emails/sent").then((r) => r.json()),
        fetch("/api/scrape/status").then((r) => r.json()),
      ]);
      const newData = JSON.stringify({ emails: e.emails, sent: s.sent?.length, status: st.status });
      if (newData !== prevDataRef.current) {
        prevDataRef.current = newData;
        setEmails(e.emails || []);
        setSentEmails(s.sent || []);
        setScraperStatus(st.status);
      }
    } catch (err) {}
  };

  useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 5000); return () => clearInterval(id); }, []);

  const handleDelete = async (email) => {
    await fetch(`/api/emails/${encodeURIComponent(email)}`, { method: "DELETE" });
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSendAll = () => {
    setConfirmMsg(`Send emails to ${emails.length} recipient(s)?`);
  };

  const doSendAll = async () => {
    setConfirmMsg(null);
    setSending(true); setMessage(null);
    try {
      const res = await fetch("/api/emails/send", { method: "POST" });
      const data = await res.json();
      setMessage({ type: res.ok ? "success" : "error", text: res.ok ? `Sent: ${data.sent}, Failed: ${data.failed}` : data.error });
      if (res.ok) fetchAll();
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSending(false); }
  };

  const handleAddEmail = async () => {
    const list = newEmail.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
    if (list.length === 0) return;
    try {
      const res = await fetch("/api/emails/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Added ${data.added} email(s)` });
        setNewEmail("");
        fetchAll();
      } else { setMessage({ type: "error", text: data.error }); }
    } catch (err) { setMessage({ type: "error", text: err.message }); }
  };

  const filtered = filter ? emails.filter((e) => e.toLowerCase().includes(filter.toLowerCase())) : emails;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const sentTotalPages = Math.max(1, Math.ceil(sentEmails.length / perPage));
  const safeSentPage = Math.min(sentPage, sentTotalPages);
  const pagedSent = sentEmails.slice((safeSentPage - 1) * perPage, safeSentPage * perPage);

  const statusLabel = { idle: "Ready to initialize task", running: "Scraping in progress...", sending: "Sending emails...", done: "Scraping complete", error: "Error occurred" };

  const PageInput = ({ currentPage, total, onPageChange }) => {
    const [val, setVal] = useState(String(currentPage));
    useEffect(() => { setVal(String(currentPage)); }, [currentPage]);
    return (
      <input type="text" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { const v = parseInt(val); if (v >= 1 && v <= total) onPageChange(v); else setVal(String(currentPage)); }}
        onKeyDown={(e) => { if (e.key === "Enter") { const v = parseInt(val); if (v >= 1 && v <= total) onPageChange(v); else setVal(String(currentPage)); } }}
        style={{ width: 36, textAlign: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#c8cdd5", fontSize: "0.8rem", padding: "3px 2px", outline: "none" }}
      />
    );
  };

  const PaginationControls = ({ currentPage, total, onPageChange }) => total <= 1 ? null : (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button className="btn btn-sm" onClick={() => onPageChange(1)} disabled={currentPage === 1} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>&laquo;</button>
      <button className="btn btn-sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>&lsaquo;</button>
      <span style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 4px", fontSize: "0.8rem", color: "#6b7280" }}>
        <PageInput currentPage={currentPage} total={total} onPageChange={onPageChange} /> / {total}
      </span>
      <button className="btn btn-sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === total} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>&rsaquo;</button>
      <button className="btn btn-sm" onClick={() => onPageChange(total)} disabled={currentPage === total} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>&raquo;</button>
    </div>
  );

  return (
    <div>


      <Toast message={message} onClear={() => setMessage(null)} />
      <ConfirmDialog message={confirmMsg} onConfirm={doSendAll} onCancel={() => setConfirmMsg(null)} />

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Emails in Queue</span>
            <span className="stat-card-icon">&#9993;</span>
          </div>
          <div className="stat-card-value">{emails.length.toLocaleString()}</div>
          <div className="stat-card-sub">Pending outreach</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Emails Sent</span>
            <span className="stat-card-icon">&#10004;</span>
          </div>
          <div className="stat-card-value">{sentEmails.length.toLocaleString()}</div>
          <div className="stat-card-sub">Total historical output</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Scraper Status</span>
            <span className="stat-card-icon">&#9881;</span>
          </div>
          <div className="stat-card-value" style={{ display: "flex", alignItems: "center" }}>
            {scraperStatus.charAt(0).toUpperCase() + scraperStatus.slice(1)}
            <span className={`status-dot ${scraperStatus}`}></span>
          </div>
          <div className="stat-card-sub">{statusLabel[scraperStatus]}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Email Queue</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="text" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Add emails (comma separated)"
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                style={{
                  padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, color: "#c8cdd5", fontSize: "0.8rem", width: 240,
                }} />
              <button className="btn btn-primary btn-sm" onClick={handleAddEmail} disabled={!newEmail.trim()}>Add</button>
            </div>
            <button className="btn btn-success btn-sm" onClick={handleSendAll} disabled={sending || emails.length === 0}>
              {sending ? "Sending..." : "Send All"}
            </button>
            <div className="filter-wrap">
              <span className="filter-icon">&#128269;</span>
              <input className="filter-input" placeholder="Filter..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>

        {(sending || scraperStatus === "sending") && (
          <div style={{ height: 3, borderRadius: 2, background: "rgba(96,165,250,0.1)", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: "40%", background: "linear-gradient(90deg, #60a5fa, #2563eb)", borderRadius: 2, animation: "loadingBar 1.2s ease-in-out infinite" }} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">{filter ? "No emails match your filter." : "No emails in queue. Run the scraper to find emails."}</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th style={{ width: 60 }}>#</th><th>Email Address</th><th style={{ width: 80, textAlign: "center" }}>Actions</th></tr></thead>
                <tbody>
                  {paged.map((email, i) => (
                    <tr key={email}>
                      <td style={{ color: "#555" }}>{(safePage - 1) * perPage + i + 1}</td>
                      <td>{email}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="delete-icon" onClick={() => handleDelete(email)} title="Remove">&times;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Showing {filtered.length} entries in queue</span>
              <PaginationControls currentPage={safePage} total={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {sentEmails.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Sent History</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th style={{ width: 60 }}>#</th><th>Email Address</th><th style={{ width: 140 }}>Sent At</th></tr></thead>
              <tbody>
                {pagedSent.map((item, i) => (
                  <tr key={item.email}>
                    <td style={{ color: "#555" }}>{(safeSentPage - 1) * perPage + i + 1}</td>
                    <td>{item.email}</td>
                    <td style={{ color: "#555" }}>{new Date(item.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Showing {(safeSentPage - 1) * perPage + 1}–{Math.min(safeSentPage * perPage, sentEmails.length)} of {sentEmails.length} entries</span>
            <PaginationControls currentPage={safeSentPage} total={sentTotalPages} onPageChange={setSentPage} />
          </div>
        </div>
      )}
    </div>
  );
}
