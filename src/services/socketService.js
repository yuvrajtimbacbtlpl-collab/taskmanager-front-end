import socket from "../socket";

/**
 * 🌍 Global Socket Service
 * Centralized real-time event handling for entire application
 * 
 * Usage:
 * import socketService from "./socketService";
 * 
 * // Join rooms
 * socketService.joinOrganization(orgId);
 * socketService.joinProject(projectId);
 * 
 * // Listen for events with auto-cleanup
 * const unsubscribe = socketService.onDataUpdate("staffCreated", (payload) => {
 *   console.log("New staff:", payload);
 *   fetchStaff();
 * });
 * 
 * // Unsubscribe when component unmounts
 * return () => unsubscribe?.();
 */

const socketService = {
  // ==================== ROOM MANAGEMENT ====================

  /**
   * Join organization room
   * All staff and project changes broadcast to org_${orgId}
   */
  joinOrganization: (orgId) => {
    if (orgId) {
      socket.emit("joinOrganization", orgId);
      console.log(`✅ Joined organization room: org_${orgId}`);
    }
  },

  /**
   * Leave organization room
   */
  leaveOrganization: (orgId) => {
    if (orgId) {
      socket.emit("leaveOrganization", orgId);
      console.log(`❌ Left organization room: org_${orgId}`);
    }
  },

  /**
   * Join project room
   * All task and issue changes broadcast to project_${projectId}
   */
  joinProject: (projectId) => {
    if (projectId) {
      socket.emit("joinProject", projectId);
      console.log(`✅ Joined project room: project_${projectId}`);
    }
  },

  /**
   * Leave project room
   */
  leaveProject: (projectId) => {
    if (projectId) {
      socket.emit("leaveProject", projectId);
      console.log(`❌ Left project room: project_${projectId}`);
    }
  },

  // ==================== EVENT LISTENERS ====================

  /**
   * Generic socket.on with auto-cleanup
   * Returns unsubscribe function for useEffect cleanup
   * 
   * Usage:
   * useEffect(() => {
   *   const unsubscribe = socketService.listen("staffCreated", (data) => {
   *     console.log(data);
   *   });
   *   return () => unsubscribe?.();
   * }, []);
   */
  listen: (eventName, callback) => {
    if (!eventName || !callback) {
      console.error("listen() requires eventName and callback");
      return null;
    }

    socket.on(eventName, callback);

    // Return cleanup function
    return () => {
      socket.off(eventName, callback);
      console.log(`🔕 Unsubscribed from: ${eventName}`);
    };
  },

  /**
   * Listen to data update events with auto-refresh pattern
   * Includes built-in logging and error handling
   * 
   * Usage:
   * const unsubscribe = socketService.onDataUpdate("staffCreated", () => {
   *   refreshStaffList();
   * });
   */
  onDataUpdate: (eventName, onUpdate) => {
    if (!eventName) {
      console.error("onDataUpdate() requires eventName");
      return null;
    }

    const handleUpdate = (payload) => {
      try {
        console.log(`📢 Event received: ${eventName}`, payload);
        onUpdate?.(payload);
      } catch (err) {
        console.error(`Error handling ${eventName}:`, err);
      }
    };

    socket.on(eventName, handleUpdate);

    // Return cleanup function
    return () => {
      socket.off(eventName, handleUpdate);
      console.log(`🔕 Stopped listening to: ${eventName}`);
    };
  },

  /**
   * Listen to event only once
   */
  listenOnce: (eventName, callback) => {
    if (!eventName || !callback) {
      console.error("listenOnce() requires eventName and callback");
      return;
    }
    socket.once(eventName, callback);
  },

  /**
   * Manual socket.emit for custom events
   */
  emit: (eventName, data) => {
    if (!eventName) {
      console.error("emit() requires eventName");
      return;
    }
    socket.emit(eventName, data);
    console.log(`📤 Emitted: ${eventName}`, data);
  },

  // ==================== STAFF EVENTS ====================

  onStaffCreated: (callback) =>
    socketService.onDataUpdate("staffCreated", callback),

  onStaffDeleted: (callback) =>
    socketService.onDataUpdate("staffDeleted", callback),

  onStaffRoleUpdated: (callback) =>
    socketService.onDataUpdate("staffRoleUpdated", callback),

  onStaffStatusChanged: (callback) =>
    socketService.onDataUpdate("staffStatusChanged", callback),

  // ==================== PROJECT EVENTS ====================

  onProjectCreated: (callback) =>
    socketService.onDataUpdate("projectCreated", callback),

  onProjectDeleted: (callback) =>
    socketService.onDataUpdate("projectDeleted", callback),

  onProjectMemberAdded: (callback) =>
    socketService.onDataUpdate("projectMemberAdded", callback),

  onProjectMemberRemoved: (callback) =>
    socketService.onDataUpdate("projectMemberRemoved", callback),

  onProjectUpdated: (callback) =>
    socketService.onDataUpdate("projectUpdated", callback),

  // ==================== TASK EVENTS ====================

  onTaskCreated: (callback) =>
    socketService.onDataUpdate("taskCreated", callback),

  onTaskDeleted: (callback) =>
    socketService.onDataUpdate("taskDeleted", callback),

  onTaskStatusChanged: (callback) =>
    socketService.onDataUpdate("taskStatusChanged", callback),

  onTaskAssigned: (callback) =>
    socketService.onDataUpdate("taskAssigned", callback),

  onTaskUpdated: (callback) =>
    socketService.onDataUpdate("taskUpdated", callback),

  // ==================== ISSUE EVENTS ====================

  onIssueCreated: (callback) =>
    socketService.onDataUpdate("issueCreated", callback),

  onIssueDeleted: (callback) =>
    socketService.onDataUpdate("issueDeleted", callback),

  onIssueStatusChanged: (callback) =>
    socketService.onDataUpdate("issueStatusChanged", callback),

  onIssueAssigned: (callback) =>
    socketService.onDataUpdate("issueAssigned", callback),

  onIssueUpdated: (callback) =>
    socketService.onDataUpdate("issueUpdated", callback),

  // ==================== DOCUMENT EVENTS ====================

  onDocumentUploaded: (callback) =>
    socketService.onDataUpdate("documentUploaded", callback),

  onDocumentDeleted: (callback) =>
    socketService.onDataUpdate("documentDeleted", callback),

  onDocumentPermissionsUpdated: (callback) =>
    socketService.onDataUpdate("documentPermissionsUpdated", callback),

  // ==================== CONNECTION STATUS ====================

  /**
   * Check if socket is connected
   */
  isConnected: () => socket.connected,

  /**
   * Get socket ID
   */
  getSocketId: () => socket.id,

  /**
   * Disconnect socket
   */
  disconnect: () => {
    socket.disconnect();
    console.log("🔌 Socket disconnected");
  },

  /**
   * Reconnect socket
   */
  reconnect: () => {
    socket.connect();
    console.log("🔗 Socket reconnected");
  },

  // ==================== BATCH LISTENERS ====================

  /**
   * Listen to multiple staff events at once
   * Returns object with all unsubscribe functions
   */
  listenToStaffUpdates: (onStaffEvent) => {
    const unsubscribers = {
      created: socketService.onStaffCreated(() => {
        onStaffEvent?.("created");
      }),
      deleted: socketService.onStaffDeleted(() => {
        onStaffEvent?.("deleted");
      }),
      roleUpdated: socketService.onStaffRoleUpdated(() => {
        onStaffEvent?.("roleUpdated");
      }),
      statusChanged: socketService.onStaffStatusChanged(() => {
        onStaffEvent?.("statusChanged");
      }),
    };

    return () => {
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
    };
  },

  /**
   * Listen to multiple project events at once
   */
  listenToProjectUpdates: (onProjectEvent) => {
    const unsubscribers = {
      created: socketService.onProjectCreated(() => {
        onProjectEvent?.("created");
      }),
      deleted: socketService.onProjectDeleted(() => {
        onProjectEvent?.("deleted");
      }),
      memberAdded: socketService.onProjectMemberAdded(() => {
        onProjectEvent?.("memberAdded");
      }),
      memberRemoved: socketService.onProjectMemberRemoved(() => {
        onProjectEvent?.("memberRemoved");
      }),
      updated: socketService.onProjectUpdated(() => {
        onProjectEvent?.("updated");
      }),
    };

    return () => {
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
    };
  },

  /**
   * Listen to multiple task events at once
   */
  listenToTaskUpdates: (onTaskEvent) => {
    const unsubscribers = {
      created: socketService.onTaskCreated(() => {
        onTaskEvent?.("created");
      }),
      deleted: socketService.onTaskDeleted(() => {
        onTaskEvent?.("deleted");
      }),
      statusChanged: socketService.onTaskStatusChanged(() => {
        onTaskEvent?.("statusChanged");
      }),
      assigned: socketService.onTaskAssigned(() => {
        onTaskEvent?.("assigned");
      }),
      updated: socketService.onTaskUpdated(() => {
        onTaskEvent?.("updated");
      }),
    };

    return () => {
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
    };
  },

  /**
   * Listen to multiple issue events at once
   */
  listenToIssueUpdates: (onIssueEvent) => {
    const unsubscribers = {
      created: socketService.onIssueCreated(() => {
        onIssueEvent?.("created");
      }),
      deleted: socketService.onIssueDeleted(() => {
        onIssueEvent?.("deleted");
      }),
      statusChanged: socketService.onIssueStatusChanged(() => {
        onIssueEvent?.("statusChanged");
      }),
      assigned: socketService.onIssueAssigned(() => {
        onIssueEvent?.("assigned");
      }),
      updated: socketService.onIssueUpdated(() => {
        onIssueEvent?.("updated");
      }),
    };

    return () => {
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
    };
  },
};

export default socketService;
