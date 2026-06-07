import { createPortal } from "react-dom";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  if (!message) return null;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1a1d25", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "28px 32px", maxWidth: 400, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", marginBottom: 8 }}>Confirm Action</div>
        <div style={{ fontSize: "0.88rem", color: "#9ca3af", lineHeight: 1.5, marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "#9ca3af", fontSize: "0.84rem", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(37,99,235,0.5)",
            background: "rgba(37,99,235,0.15)", color: "#60a5fa", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer",
          }}>Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
