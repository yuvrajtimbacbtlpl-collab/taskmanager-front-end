// src/components/ui/Toast.jsx
// Enhanced toast with icon, title, message, and auto-dismiss

import { useEffect } from "react";

const CONFIG = {
  success: {
    icon: "✅",
    title: "Success",
    gradient: "linear-gradient(135deg, #15803d, #16a34a)",
    border: "#166534",
  },
  warning: {
    icon: "✏️",
    title: "Updated",
    gradient: "linear-gradient(135deg, #b45309, #d97706)",
    border: "#92400e",
  },
  update: {
    icon: "✏️",
    title: "Updated",
    gradient: "linear-gradient(135deg, #b45309, #d97706)",
    border: "#92400e",
  },
  error: {
    icon: "❌",
    title: "Error",
    gradient: "linear-gradient(135deg, #b91c1c, #dc2626)",
    border: "#991b1b",
  },
  delete: {
    icon: "🗑️",
    title: "Deleted",
    gradient: "linear-gradient(135deg, #b91c1c, #dc2626)",
    border: "#991b1b",
  },
  info: {
    icon: "ℹ️",
    title: "Info",
    gradient: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    border: "#1e40af",
  },
};

export default function Toast({
  message,
  type = "success",
  onClose = () => {},
  duration = 4000,
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const cfg = CONFIG[type] || CONFIG.success;

  return (
    <div
      className={`toast-card toast-${type}`}
      style={{
        background: cfg.gradient,
        borderLeft: `4px solid ${cfg.border}`,
      }}
    >
      <div className="toast-content">
        <span className="icon">{cfg.icon}</span>
        <div>
          <div className="toast-title">{cfg.title}</div>
          <div className="toast-message">{message}</div>
        </div>
      </div>
      <button
        className="toast-close"
        onClick={() => typeof onClose === "function" && onClose()}
      >
        ✕
      </button>
    </div>
  );
}

/**
 * ToastStack — renders multiple toasts stacked from bottom
 */
export function ToastStack({ toasts = [], onRemove }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
      }}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message || t.text}
          type={t.type}
          onClose={() => onRemove && onRemove(t.id)}
        />
      ))}
    </div>
  );
}
