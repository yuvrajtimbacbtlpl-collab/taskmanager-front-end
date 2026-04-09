// src/components/FormModal.jsx
// Reusable modal/form overlay — uses your exact .modal-overlay / .modal-card CSS classes
// The form content you pass as children, modal just handles the wrapper + header + close
//
// Props:
//   open      — boolean
//   onClose   — fn
//   title     — string
//   children  — form fields / content
//   size      — "sm" | "md" | "lg" (default "md")
//              sm=420px  md=520px  lg=700px
//
// Usage:
//   <FormModal open={showForm} onClose={() => setShowForm(false)} title="Create Staff">
//     <form onSubmit={handleSubmit}>
//       <div className="form-field">
//         <label>Username</label>
//         <input value={form.username} onChange={...} />
//       </div>
//       <button type="submit" className="btn-primary full" disabled={saving}>
//         {saving ? "Saving..." : "Create Staff"}
//       </button>
//     </form>
//   </FormModal>

import { useEffect } from "react";
import { createPortal } from "react-dom";

const SIZE_MAP = {
  sm: "420px",
  md: "520px",
  lg: "700px",
};

export default function FormModal({
  open,
  onClose,
  title,
  children,
  size = "md",
}) {
  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent background scroll when modal is open
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

  if (!open) return null;

  // Use React Portal so the modal renders directly into document.body,
  // completely escaping the dashboard layout container (overflow:hidden,
  // transforms, etc.) that was clipping the overlay on the left side.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          width: SIZE_MAP[size] || SIZE_MAP.md,
          maxWidth: "calc(100vw - 32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
