// src/components/ToastMessage.jsx
// Each type has its own distinct color, icon, and title — nothing is hardcoded wrong.
// Types:
//   "success" → green   → Created / Saved / Done
//   "update"  → yellow  → Updated / Changed
//   "warning" → yellow  → Updated / Changed (alias)
//   "delete"  → red     → Deleted / Removed
//   "error"   → dark red → Error / Failed
//   "info"    → blue    → Info / Notice

import { useEffect } from "react";
import "../styles/toast.css";

const TOAST_CONFIG = {
  success: {
    icon: "✅",
    title: "Success",
    className: "toast-success",
  },
  update: {
    icon: "✏️",
    title: "Updated",
    className: "toast-update",
  },
  warning: {
    icon: "✏️",
    title: "Updated",
    className: "toast-update",
  },
  delete: {
    icon: "🗑️",
    title: "Deleted",
    className: "toast-delete",
  },
  error: {
    icon: "⚠️",
    title: "Error",
    className: "toast-error",
  },
  info: {
    icon: "ℹ️",
    title: "Notice",
    className: "toast-info",
  },
};

export default function ToastMessage({
  message,
  type = "success",
  onClose = () => {},
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const cfg = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  // Strip leading ✓ from messages since icon handles that
  const cleanMsg = (message || "").replace(/^[✓✅🗑️⚠️ℹ️✏️]\s*/, "").trim();

  return (
    <div className={`toast-card ${cfg.className}`}>
      <div className="toast-icon-wrap">
        <span className="toast-icon">{cfg.icon}</span>
      </div>
      <div className="toast-body">
        <div className="toast-title">{cfg.title}</div>
        <div className="toast-message">{cleanMsg}</div>
      </div>
      <button
        className="toast-close"
        onClick={() => typeof onClose === "function" && onClose()}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
