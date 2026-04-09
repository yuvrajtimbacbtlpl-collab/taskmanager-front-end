import { createContext, useContext, useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useAuth } from "./AuthContext";
import { useProject } from "./ProjectContext";



const GlobalSocketContext = createContext();

export function GlobalSocketProvider({ children }) {
  const { user } = useAuth();
  const { selectedProject } = useProject();

  // Notification state
  const [documentRequestNotification, setDocumentRequestNotification] = useState(null);

  // Track rooms to prevent duplicate joins
  const currentRoomsRef = useRef({
    organization: null,
    project: null,
  });

  const connectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  /* ==================== SOCKET INITIALIZATION ==================== */

  useEffect(() => {
    if (!user) {
      console.log("🔌 No user - socket not connecting");
      return;
    }

    // Avoid multiple connection attempts
    if (isConnectingRef.current) {
      console.log("⏳ Socket connection already in progress");
      return;
    }

    // Check if already connected
    if (socket.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    // Connect socket
    isConnectingRef.current = true;
    console.log("🔌 Connecting socket...");
    socket.connect();

    const onConnect = () => {
      console.log("✅ Socket connected!");
      isConnectingRef.current = false;

      // Join personal user room for direct notifications
      if (user?._id) {
        socket.emit("joinUser", user._id);
        console.log(`✅ Joined user room: user_${user._id}`);
      }

      // Join organization room after connection
      joinOrganizationRoom();
    };

    const onDisconnect = () => {
      console.log("❌ Socket disconnected");
      currentRoomsRef.current.organization = null;
      currentRoomsRef.current.project = null;
    };

    // === Document Request Notification ===
    const onDocumentRequest = (data) => {
      console.log("📬 Document request received:", data);
      setDocumentRequestNotification({
        type: "document_request",
        requesterName: data.requester?.name || data.requester?.email,
        requesterEmail: data.requester?.email,
        documentId: data.documentId,
        requesterId: data.requester?.id,
        documentTitle: data.documentTitle,
        status: "pending",
      });
    };

    // === Real-time popup event listeners ===
    const onAccessRequested = (data) => {
      console.log("📬 Access requested event received:", data);
      setDocumentRequestNotification({
        type: "info",
        title: "Access Request",
        message: `${data.requesterName} (${data.requesterEmail}) requests access to ${data.documentTitle}`,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        documentId: data.documentId,
        requesterId: data.requesterId,
        documentTitle: data.documentTitle,
        status: "pending",
      });
    };

    const onAccessGranted = (data) => {
      console.log("✅ Access granted event received:", data);
      setDocumentRequestNotification({
        type: "success",
        title: "Access Granted",
        message: data?.message || "You have been granted access!",
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("documentRequest", onDocumentRequest);
    socket.on("documentAccessRequested", onAccessRequested);
    socket.on("access-granted", onAccessGranted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("documentRequest", onDocumentRequest);
      socket.off("documentAccessRequested", onAccessRequested);
      socket.off("access-granted", onAccessGranted);
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, [user]);

  /* ==================== ROOM MANAGEMENT ==================== */

  /**
   * Join organization room
   * Called once when user logs in
   */
  const joinOrganizationRoom = () => {
    if (!user?._id) return;

    const roomId = "org_default"; // Using org_default as per your setup

    // Prevent duplicate joins
    if (currentRoomsRef.current.organization === roomId) {
      console.log(`📍 Already in organization room: ${roomId}`);
      return;
    }

    console.log(`📍 Joining organization room: ${roomId}`);
    socket.emit("joinOrganization", user._id);
    currentRoomsRef.current.organization = roomId;
  };

  /**
   * Leave organization room
   * Called when user logs out
   */
  const leaveOrganizationRoom = () => {
    if (!currentRoomsRef.current.organization) return;

    console.log(`🚪 Leaving organization room`);
    socket.emit("leaveOrganization", user._id);
    currentRoomsRef.current.organization = null;
  };

  /**
   * Join project room
   * Called when project is selected
   */
  const joinProjectRoom = (projectId) => {
    if (!projectId) {
      // If no project selected, leave current project room
      if (currentRoomsRef.current.project) {
        leaveProjectRoom();
      }
      return;
    }

    // Prevent duplicate joins
    if (currentRoomsRef.current.project === projectId) {
      console.log(`📍 Already in project room: project_${projectId}`);
      return;
    }

    // Leave previous project room if exists
    if (currentRoomsRef.current.project) {
      console.log(`🚪 Leaving previous project room: project_${currentRoomsRef.current.project}`);
      socket.emit("leaveProject", currentRoomsRef.current.project);
    }

    console.log(`📍 Joining project room: project_${projectId}`);
    socket.emit("joinProject", projectId);
    currentRoomsRef.current.project = projectId;
  };

  /**
   * Leave project room
   */
  const leaveProjectRoom = () => {
    if (!currentRoomsRef.current.project) return;

    const projectId = currentRoomsRef.current.project;
    console.log(`🚪 Leaving project room: project_${projectId}`);
    socket.emit("leaveProject", projectId);
    currentRoomsRef.current.project = null;
  };

  /* ==================== PROJECT SELECTION HANDLER ==================== */

  /**
   * When project changes, update room membership
   */
  useEffect(() => {
    if (selectedProject?._id) {
      joinProjectRoom(selectedProject._id);
    } else {
      leaveProjectRoom();
    }
  }, [selectedProject?._id]);

  /* ==================== CLEANUP ==================== */

  /**
   * Cleanup on component unmount or user logout
   */
  useEffect(() => {
    return () => {
      if (!user) {
        leaveOrganizationRoom();
        leaveProjectRoom();

        // Disconnect socket if user logs out
        if (socket.connected) {
          console.log("🔌 Disconnecting socket on logout");
          socket.disconnect();
        }
      }
    };
  }, [user]);

  /* ==================== CONTEXT VALUE ==================== */

  const value = {
    socket,
    currentRooms: currentRoomsRef.current,
    documentRequestNotification,
    setDocumentRequestNotification,
  };

  return (
    <GlobalSocketContext.Provider value={value}>
      {children}
    </GlobalSocketContext.Provider>
  );
}

/**
 * Hook to access global socket context
 */
export function useGlobalSocket() {
  const context = useContext(GlobalSocketContext);

  if (!context) {
    throw new Error("useGlobalSocket must be used within GlobalSocketProvider");
  }

  return context;
}
