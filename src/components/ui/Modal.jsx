// src/components/ui/Modal.jsx
// Reusable modal overlay + card with portal-like behavior

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - title: string
 *  - children: ReactNode
 *  - width: string (default '520px')
 *  - closeOnBackdrop: boolean (default true)
 *  - footer: ReactNode (optional action bar)
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "520px",
  closeOnBackdrop = true,
  footer,
}) {
  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC key close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="staff-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className="staff-form-card"
        style={{ width, maxWidth: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="staff-form-header">
            <h3>{title}</h3>
            <button className="close-btn" onClick={onClose} type="button">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
