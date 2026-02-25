import { useState } from "react";
import { api } from "../api";

export default function DeleteConfirmPopup({ staffId, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");

      if (!password) {
        setError("Admin password is required");
        setLoading(false);
        return;
      }

      await api("/auth/verify-password", {
        method: "POST",
        body: { password },
      });

      await api(`/auth/staff/${staffId}`, {
        method: "DELETE",
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err?.message ||
        err?.msg ||
        "Incorrect password"
      );
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="success-overlay">
      <div className="success-card delete-card">

        {/* ICON */}
        <div className="delete-icon">⚠️</div>

        {/* TITLE */}
        <h2 className="delete-title">Confirm Deletion</h2>

        <p className="delete-subtitle">
          This action cannot be undone. Please enter your admin password to continue.
        </p>

        {/* PASSWORD FIELD */}
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter your login password"
            onChange={(e) => setPassword(e.target.value)}
            className={error ? "input-error" : ""}
          />
        </div>

        {/* ERROR */}
        {error && <div className="error-box">{error}</div>}

        {/* BUTTONS */}
        <div className="delete-actions">
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Yes, Delete"}
          </button>

          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}