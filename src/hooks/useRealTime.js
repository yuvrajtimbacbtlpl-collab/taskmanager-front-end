import { useEffect, useRef, useCallback } from "react";
import socketService from "../services/socketService";

/**
 * Custom hook for real-time updates
 * Handles Socket.IO event listening and automatic data refresh
 *
 * @param {string} room - Room to join (e.g., 'org_default', 'project_123')
 * @param {Function} fetchData - Function to call when data needs refresh
 * @param {Array} events - Array of event names to listen for
 * @param {Array} dependencies - useEffect dependencies
 * @returns {Object} { isConnected, isLoading, error }
 */
export const useRealTime = (room, fetchData, events = [], dependencies = []) => {
  const fetchDataRef = useRef(null);
  const unsubscribersRef = useRef([]);
  const isConnectedRef = useRef(false);

  // Store fetch function
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Join room and setup listeners
  useEffect(() => {
    if (!room || !fetchData) return;

    // Join room
    if (room.startsWith("org_")) {
      socketService.joinOrganization(room.replace("org_", ""));
      console.log(`✅ Joined organization room: ${room}`);
    } else if (room.startsWith("project_")) {
      const projectId = room.replace("project_", "");
      socketService.joinProject(projectId);
      console.log(`✅ Joined project room: ${room}`);
    }

    isConnectedRef.current = socketService.isConnected();

    // Setup event listeners
    const setupListeners = () => {
      // Clear old listeners
      unsubscribersRef.current.forEach((unsub) => unsub?.());
      unsubscribersRef.current = [];

      // Generic event handler
      const handleEvent = (eventName) => {
        return () => {
          console.log(`📡 Event received: ${eventName}`);
          if (fetchDataRef.current) {
            fetchDataRef.current();
          }
        };
      };

      // Subscribe to provided events
      if (events && events.length > 0) {
        events.forEach((event) => {
          if (event === "staffCreated" || event === "staffDeleted" || event === "staffRoleUpdated") {
            const unsub = socketService[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]?.(handleEvent(event));
            if (unsub) unsubscribersRef.current.push(unsub);
          } else if (event === "projectCreated" || event === "projectDeleted" || event === "projectUpdated") {
            const unsub = socketService[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]?.(handleEvent(event));
            if (unsub) unsubscribersRef.current.push(unsub);
          } else if (event === "taskCreated" || event === "taskDeleted" || event === "taskStatusChanged") {
            const unsub = socketService[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]?.(handleEvent(event));
            if (unsub) unsubscribersRef.current.push(unsub);
          } else if (event === "issueCreated" || event === "issueDeleted" || event === "issueStatusChanged") {
            const unsub = socketService[`on${event.charAt(0).toUpperCase() + event.slice(1)}`]?.(handleEvent(event));
            if (unsub) unsubscribersRef.current.push(unsub);
          }
        });
      }

      console.log(`✅ ${events.length} event listeners attached`);
    };

    // Setup listeners after small delay to ensure socket is ready
    const timer = setTimeout(setupListeners, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      unsubscribersRef.current.forEach((unsub) => unsub?.());
      
      if (room.startsWith("org_")) {
        socketService.leaveOrganization(room.replace("org_", ""));
      } else if (room.startsWith("project_")) {
        socketService.leaveProject(room.replace("project_", ""));
      }
    };
  }, [room, ...dependencies]);

  return {
    isConnected: isConnectedRef.current,
  };
};

export default useRealTime;
