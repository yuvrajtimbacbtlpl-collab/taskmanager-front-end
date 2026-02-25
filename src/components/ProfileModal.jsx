import { ROLE_LABELS } from "../utils/roleLabel";
import "./ProfileModal.css";

export default function ProfileModal({ user, onClose }) {
  const roleKey = user?.role?.toUpperCase();

  const roleLabel =
    ROLE_LABELS[roleKey] || user?.role || "Unknown";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="profile-card premium"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="profile-close" onClick={onClose}>
          ✕
        </button>

        <div className="profile-header">
          <div className="avatar">
            {user?.username?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <h2>{user?.username}</h2>

          <span className={`role-badge ${roleKey?.toLowerCase()}`}>
            {roleLabel}
          </span>
        </div>

        <div className="profile-body">
          <div className="info-row">
            <span>Email</span>
            <p>{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
