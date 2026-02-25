import { useEffect } from "react";
import "../styles/toast.css";

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

  const icons = {
    success: "✅",
    warning: "✏️",
    update: "✏️",
    error: "🗑️",
    delete: "🗑️",
  };

  const titles = {
    success: "Success",
    warning: "Updated",
    update: "Updated",
    error: "Deleted",
    delete: "Deleted",
  };

  return (
    <div className={`toast-card toast-${type}`}>
      <div className="toast-content">
        <span className="icon">{icons[type] || "🔔"}</span>

        <div>
          <div className="toast-title">
            {titles[type] || "Notification"}
          </div>
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