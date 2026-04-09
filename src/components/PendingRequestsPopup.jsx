import React, { useState, useEffect } from "react";
import "./PendingRequestsPopup.css";
import api from "../api";


const PendingRequestsPopup = ({ projectId, onClose, onRequestUpdated, request }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Track which item is being actioned

  // If a single request is provided (from socket), show only that request
  const isSingleRequest = !!request;

  // Fetch pending requests on mount (list mode only)
  useEffect(() => {
    if (isSingleRequest) {
      setLoading(false);
      setRequests([]);
      return;
    }
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/documents/${projectId}/pending-requests`
        );
        setRequests(response.data.requests || []);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) {
      fetchPendingRequests();
    }
  }, [projectId, isSingleRequest]);

  const handleApprove = async (documentId, requesterId) => {
    try {
      setActionLoading(`${documentId}-${requesterId}`);
      // Call the update request endpoint
      await api.put(`/documents/${documentId}/request/${requesterId}`, {
        status: "approved",
      });
      // Remove the request from the list (list mode)
      setRequests(
        requests.filter(
          (req) =>
            !(
              req.documentId === documentId &&
              req.requesterId === requesterId
            )
        )
      );
      // Call success callback if provided
      if (onRequestUpdated) {
        onRequestUpdated("approved");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setActionLoading(null);
      // Close popup after action (single request mode)
      if (isSingleRequest) onClose();
    }
  };

  const handleReject = async (documentId, requesterId) => {
    try {
      setActionLoading(`${documentId}-${requesterId}`);
      // Call the update request endpoint
      await api.put(`/documents/${documentId}/request/${requesterId}`, {
        status: "rejected",
      });
      // Remove the request from the list (list mode)
      setRequests(
        requests.filter(
          (req) =>
            !(
              req.documentId === documentId &&
              req.requesterId === requesterId
            )
        )
      );
      // Call success callback if provided
      if (onRequestUpdated) {
        onRequestUpdated("rejected");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setActionLoading(null);
      // Close popup after action (single request mode)
      if (isSingleRequest) onClose();
    }
  };


  // Show nothing if neither projectId nor request is provided
  if (!projectId && !isSingleRequest) return null;

  // In list mode, don't show popup if no pending requests
  if (!isSingleRequest && requests.length === 0 && !loading) {
    return null;
  }

  // Single-request mode: show only the incoming request as a notification popup
  if (isSingleRequest && request) {
    return (
      <div className="pending-requests-overlay" onClick={onClose}>
        <div className="pending-requests-popup" onClick={e => e.stopPropagation()}>
          <div className="popup-header">
            <h2>Access Requests</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="popup-content" style={{ textAlign: 'center' }}>
            <div style={{ margin: '32px 0 24px 0' }}>
              <strong style={{ fontSize: 22 }}>{request.requesterEmail}</strong>
              <div style={{ fontSize: 18, marginTop: 8 }}>Status: <span style={{ color: '#888' }}>{request.status || 'pending'}</span></div>
            </div>
            <div className="request-actions" style={{ justifyContent: 'center' }}>
              <button
                className="btn btn-approve"
                style={{ minWidth: 160, fontSize: 18 }}
                onClick={() => handleApprove(request.documentId, request.requesterId)}
                disabled={actionLoading === `${request.documentId}-${request.requesterId}`}
              >
                {actionLoading === `${request.documentId}-${request.requesterId}` ? '...' : 'Approve'}
              </button>
              <button
                className="btn btn-reject"
                style={{ minWidth: 80, fontSize: 18, marginLeft: 16 }}
                onClick={() => handleReject(request.documentId, request.requesterId)}
                disabled={actionLoading === `${request.documentId}-${request.requesterId}`}
              >
                {actionLoading === `${request.documentId}-${request.requesterId}` ? '...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ...existing code for list mode...
};

export default PendingRequestsPopup;
