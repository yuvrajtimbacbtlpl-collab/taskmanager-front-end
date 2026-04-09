// src/components/DeleteConfirmPopup.jsx
// Staff delete with admin password verification — industry-level design
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { ShieldAlert, Trash2, X, Lock, Eye, EyeOff } from "lucide-react";
import "../styles/DeleteConfirmPopup.css";

export default function DeleteConfirmPopup({
  staffId,
  onClose,
  onSuccess,
  // alternate simple mode (no password needed) — used by non-staff deletes
  onConfirm,
  onCancel,
  title = "Delete Staff Member",
  message = "This action cannot be undone. Please enter your admin password to authorise.",
  loading: externalLoading = false,
}) {
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const isPasswordMode = !!staffId;    // password-gate mode when staffId provided
  const isSimpleMode   = !!onConfirm;  // simple confirm when onConfirm provided

  // ESC to close
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") (onCancel || onClose)?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePasswordDelete = async () => {
    if (!password.trim()) { setError("Admin password is required"); return; }
    setLoading(true); setError("");
    try {
      await api("/auth/verify-password", { method: "POST", body: { password } });
      await api(`/auth/staff/${staffId}`, { method: "DELETE" });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || err?.msg || "Incorrect password. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => (onCancel || onClose)?.();

  const ts = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return createPortal(
    <div className="dcp-overlay" onClick={cancel}>
      <div className="dcp-card" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="dcp-close" onClick={cancel} type="button">
          <X size={15} />
        </button>

        {/* Icon */}
        <div className="dcp-icon-wrap">
          {isPasswordMode
            ? <ShieldAlert size={30} />
            : <Trash2 size={30} />}
        </div>

        {/* Title */}
        <h3 className="dcp-title">{title}</h3>

        {/* Message */}
        <p className="dcp-msg">{message}</p>

        {/* Password field — only in password mode */}
        {isPasswordMode && (
          <>
            <div className="dcp-field">
              <label className="dcp-label">
                <Lock size={12} /> Admin Password
              </label>
              <div className="dcp-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className={`dcp-input${error ? " dcp-input--error" : ""}`}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordDelete()}
                />
                <button
                  type="button"
                  className="dcp-eye"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <div className="dcp-error">{error}</div>}
            </div>

            <div className="dcp-timestamp">🕐 {ts}</div>
          </>
        )}

        {/* Simple mode warning */}
        {isSimpleMode && !isPasswordMode && (
          <div className="dcp-warning-bar">
            <ShieldAlert size={13} />
            <span>This action is permanent and cannot be reversed</span>
          </div>
        )}

        {/* Actions */}
        <div className="dcp-actions">
          <button
            type="button"
            className="dcp-btn dcp-btn--cancel"
            onClick={cancel}
            disabled={loading || externalLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="dcp-btn dcp-btn--delete"
            onClick={isPasswordMode ? handlePasswordDelete : onConfirm}
            disabled={loading || externalLoading || (isPasswordMode && !password.trim())}
          >
            {(loading || externalLoading) ? (
              <span className="dcp-spinner-wrap">
                <span className="dcp-spinner" />
                {isPasswordMode ? "Verifying..." : "Deleting..."}
              </span>
            ) : (
              <>
                <Trash2 size={14} />
                {isPasswordMode ? "Verify & Delete" : "Yes, Delete"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
