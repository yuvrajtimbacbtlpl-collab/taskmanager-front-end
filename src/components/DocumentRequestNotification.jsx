import React, { useState } from "react";
import "./DocumentRequestNotification.css";
import api from "../api";

const DocumentRequestNotification = ({
  notification,
  onClose,
  onRequestUpdated,
}) => {
  const [actionLoading, setActionLoading] = useState(null);

  if (!notification) return null;

  // Extract requester ID safely
  const requesterId =
    notification.requesterId ||
    notification.requester?._id ||
    notification.requester;

  const documentId = notification.documentId;

  console.log("Notification Data:", notification);
  console.log("Document ID:", documentId);
  console.log("Requester ID:", requesterId);

  const handleApprove = async () => {
    if (!requesterId) {
      console.error("Requester ID missing!");
      alert("Requester ID not found.");
      return;
    }

    try {
      setActionLoading("approve");

      await api.put(`/documents/${documentId}/request/${requesterId}`, {
        status: "approved",
      });

      if (onRequestUpdated) {
        onRequestUpdated("approved");
      }

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!requesterId) {
      console.error("Requester ID missing!");
      alert("Requester ID not found.");
      return;
    }

    try {
      setActionLoading("reject");

      await api.put(`/documents/${documentId}/request/${requesterId}`, {
        status: "rejected",
      });

      if (onRequestUpdated) {
        onRequestUpdated("rejected");
      }

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="document-request-notification-overlay" onClick={onClose}>
      <div
        className="document-request-notification"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="notification-close-btn"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="notification-icon">📄</div>

        {/* Header */}
        <div className="notification-header">
          <h3>Document Access Request</h3>
        </div>

        {/* Content */}
        <div className="notification-content">
          <p className="requester-name">
            <strong>
              {notification.requesterName ||
                notification.requesterEmail ||
                "Unknown User"}
            </strong>
          </p>

          <p className="requester-email">{notification.requesterEmail}</p>

          <div className="request-details">
            <p>
              <span className="detail-label">Document:</span>
              <span className="detail-value">{notification.documentTitle}</span>
            </p>

            <p>
              <span className="detail-label">Status:</span>
              <span className="detail-value pending">
                {notification.status || "pending"}
              </span>
            </p>
          </div>

          <p className="request-message">
            is requesting access to your document
          </p>
        </div>

        {/* Actions */}
        <div className="notification-actions">
          <button
            className="btn btn-approve"
            onClick={handleApprove}
            disabled={actionLoading !== null}
          >
            {actionLoading === "approve" ? "Approving..." : "✓ Approve"}
          </button>

          <button
            className="btn btn-reject"
            onClick={handleReject}
            disabled={actionLoading !== null}
          >
            {actionLoading === "reject" ? "Rejecting..." : "✕ Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestNotification;
