import { useState, useEffect } from "react";
import "./SuccessNotificationPopup.css";

/**
 * 🎉 Success Notification Popup
 * Shows fullscreen notifications for:
 * - Request created successfully
 * - Request approved/rejected
 * - Document uploaded
 * - Any other success action
 * 
 * Auto-closes after 3 seconds or on user click
 */

export default function SuccessNotificationPopup({
  isVisible,
  onClose,
  title,
  message,
  type = "success", // success, info, approved, rejected
  icon,
  autoCloseTime = 3000,
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsClosing(false);
      return;
    }

    // Auto-close after specified time
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseTime);

    return () => clearTimeout(timer);
  }, [isVisible, autoCloseTime]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation
  };

  if (!isVisible) return null;

  // Determine icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "#10b981",
          icon: icon || "✅",
          title: title || "Success!",
        };
      case "approved":
        return {
          bgColor: "#059669",
          icon: icon || "✓",
          title: title || "Request Approved!",
        };
      case "rejected":
        return {
          bgColor: "#ef4444",
          icon: icon || "✗",
          title: title || "Request Rejected",
        };
      case "info":
        return {
          bgColor: "#3b82f6",
          icon: icon || "ℹ",
          title: title || "Information",
        };
      default:
        return {
          bgColor: "#10b981",
          icon: "✅",
          title: "Success",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      className={`success-notification-popup ${isClosing ? "closing" : ""}`}
      style={{
        "--notification-color": config.bgColor,
      }}
      onClick={handleClose}
    >
      {/* Background overlay */}
      <div className="notification-overlay" />

      {/* Main notification card */}
      <div className="notification-card">
        {/* Icon */}
        <div className="notification-icon">
          <span className="icon-circle">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="notification-content">
          <h2 className="notification-title">{config.title}</h2>
          {message && <p className="notification-message">{message}</p>}
        </div>

        {/* Progress bar */}
        <div className="notification-progress" />

        {/* Close hint */}
        <div className="notification-hint">
          <small>Click to close or wait...</small>
        </div>
      </div>

      {/* Floating particles for celebration effect */}
      {type === "success" || type === "approved" ? (
        <>
          <div className="particle particle-1">✨</div>
          <div className="particle particle-2">✨</div>
          <div className="particle particle-3">✨</div>
          <div className="particle particle-4">✨</div>
        </>
      ) : null}
    </div>
  );
}
