import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function Toast({ message, onClear }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClear?.(), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return createPortal(
    <div className={`message message-${message.type}`}>{message.text}</div>,
    document.getElementById("toast-root")
  );
}
