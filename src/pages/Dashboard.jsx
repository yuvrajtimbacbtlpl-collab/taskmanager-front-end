import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import PendingRequestsPopup from "../components/PendingRequestsPopup";
import SuccessNotificationPopup from "../components/SuccessNotificationPopup";
import { Outlet, useParams } from "react-router-dom";
import socketService from "../services/socketService";

export default function Dashboard({ role, user, onLogout }) {
  const { projectId } = useParams();
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [lastProjectId, setLastProjectId] = useState(null);
  const [wasLoggedOut, setWasLoggedOut] = useState(false);

  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successConfig, setSuccessConfig] = useState({
    title: "",
    message: "",
    type: "success",
  });

  // Track if user just logged in
  useEffect(() => {
    if (user && !wasLoggedOut) {
      setWasLoggedOut(true);
    }
  }, [user, wasLoggedOut]);

  // Show popup when user selects a project (after login)
  useEffect(() => {
    if (projectId && projectId !== lastProjectId && wasLoggedOut && user) {
      setShowPendingPopup(true);
      setLastProjectId(projectId);
      setWasLoggedOut(false); // Reset for next login
    }
  }, [projectId, lastProjectId, wasLoggedOut, user]);

  // Listen for real-time document access requests
  useEffect(() => {
    const unsub = socketService.listen("documentAccessRequested", (payload) => {
      console.log("📡 Document access request received:", payload);
      // Show popup when request comes in
      if (projectId) {
        setShowPendingPopup(true);
      }
    });

    return () => {
      unsub?.();
    };
  }, [projectId]);

  // Handle request status update from PendingRequestsPopup
  const handleRequestUpdated = (status) => {
    if (status === "approved") {
      setSuccessConfig({
        title: "Access Approved! ✓",
        message: "The user now has access to this document. A notification email has been sent to them.",
        type: "approved",
      });
    } else {
      setSuccessConfig({
        title: "Request Rejected",
        message: "The access request has been declined. A notification email has been sent to the user.",
        type: "rejected",
      });
    }
    setShowSuccessNotification(true);
  };

  return (
    <div className="dashboard">
      <Sidebar role={role} />

      <div className="main">
        <Header role={role} user={user} onLogout={onLogout} />
        <div className="content">
          <Outlet />
        </div>
      </div>

      {/* Show pending requests popup on project selection after login */}
      {showPendingPopup && projectId && (
        <PendingRequestsPopup
          projectId={projectId}
          onClose={() => setShowPendingPopup(false)}
        />
      )}
    </div>
  );
}
