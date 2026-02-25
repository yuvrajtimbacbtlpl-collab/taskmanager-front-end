import { useAuth } from "../context/AuthContext";

export default function WelcomePopup({ onClose }) {
  const { user } = useAuth();

  return (
    <div className="success-overlay">
      <div className="success-card">
        
        {/* CLOSE BUTTON */}
        <button className="popup-close" onClick={onClose}>
          ✖
        </button>

        <div className="check">✓</div>

        <h2>
          Welcome back{user?.username ? `, ${user.username}` : ""} 👋
        </h2>

        <p>Login successful. Redirecting to your dashboard.</p>

      </div>
    </div>
  );
}