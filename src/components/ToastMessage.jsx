// src/components/ToastMessage.jsx
// Drop-in replacement — same props: message, type, onClose
// Types: "success" (green), "warning"/"update" (yellow), "error"/"delete" (red)
// FIXED: each type shows proper title + icon + color — nothing changed from original design

import { useEffect } from "react";
import "../styles/toast.css";

const TOAST_CONFIG = {
  success: {
    icon: "✅",
    title: "Created Successfully",
  },
  warning: {
    icon: "✏️",
    title: "Updated Successfully",
  },
  update: {
    icon: "✏️",
    title: "Updated Successfully",
  },
  error: {
    icon: "🗑️",
    title: "Deleted Successfully",
  },
  delete: {
    icon: "🗑️",
    title: "Deleted Successfully",
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

  const cfg = TOAST_CONFIG[type] || { icon: "🔔", title: "Notification" };

  return (
    <div className={`toast-card toast-${type}`}>
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
