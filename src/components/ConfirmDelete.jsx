// src/components/ConfirmDelete.jsx
// Drop-in replacement — same props: title, message, onConfirm, onCancel, loading
// FIXED: React Portal so it renders into document.body — no more overlay clipping

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle } from "lucide-react";
import "../styles/confirmDelete.css";

export default function ConfirmDelete({
  title = "Delete Item",
  message = "This action cannot be undone.",
  onConfirm,
  onCancel,
  loading = false,
}) {
  // ESC key to cancel
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const timestamp = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return createPortal(
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="cd-close" onClick={onCancel} type="button">
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="cd-icon">
          <Trash2 size={28} />
        </div>

        {/* Title */}
        <h3>{title}</h3>

        {/* Message */}
        <p>{message}</p>

        {/* Warning notice */}
        <div className="cd-warning">
          <AlertTriangle size={13} />
          <span>This will permanently remove the record</span>
        </div>

        {/* Timestamp */}
        <div className="cd-timestamp">
          🕐 {timestamp}
        </div>

        {/* Actions */}
        <div className="cd-actions">
          <button className="cd-btn cancel" onClick={onCancel} type="button" disabled={loading}>
            Cancel
          </button>
          <button className="cd-btn delete" onClick={onConfirm} type="button" disabled={loading}>
            {loading ? (
              <span className="cd-spinner-wrap">
                <span className="cd-spinner" />
                Deleting...
              </span>
            ) : (
              <>
                <Trash2 size={14} />
                Yes, Delete
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
