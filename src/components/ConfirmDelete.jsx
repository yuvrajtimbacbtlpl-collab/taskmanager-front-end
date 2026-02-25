import { Trash2, X } from "lucide-react";
import "../styles/confirmDelete.css";

export default function ConfirmDelete({
  title = "Delete Item",
  message = "Are you sure you want to delete this item?",
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <div className="cd-overlay">
      <div className="cd-card">

        <button className="cd-close" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className="cd-icon">
          <Trash2 size={34} />
        </div>

        <h3>{title}</h3>
        <p>{message}</p>

        <div className="cd-actions">
          <button className="cd-btn cancel" onClick={onCancel}>
            Cancel
          </button>

          <button
            className="cd-btn delete"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>

      </div>
    </div>
  );
}