import { useEffect, useRef } from "react";
import socketService from "../services/socketService";

/**
 * Simple Real-Time Provider Component
 * Wraps any component and provides real-time updates
 *
 * Usage:
 * <RealTimeProvider room="org_default" events={["projectCreated", "projectDeleted"]}>
 *   <YourComponent />
 * </RealTimeProvider>
 */
export const RealTimeProvider = ({ room, events = [], children, onEvent }) => {
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    if (!room) return;

    // Join appropriate room
    if (room.startsWith("org_")) {
      socketService.joinOrganization(room.replace("org_", ""));
    } else if (room.startsWith("project_")) {
      socketService.joinProject(room.replace("project_", ""));
    }

    console.log(`🔵 RealTimeProvider joined room: ${room}`);

    // Cleanup subscriptions
    const cleanup = () => {
      unsubscribersRef.current.forEach((unsub) => unsub?.());
      unsubscribersRef.current = [];
    };

    cleanup();

    // Subscribe to events
    events.forEach((event) => {
      let unsub;

      if (event === "projectCreated") {
        unsub = socketService.onProjectCreated((data) => {
          console.log("✅ projectCreated event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "projectDeleted") {
        unsub = socketService.onProjectDeleted((data) => {
          console.log("✅ projectDeleted event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "projectUpdated") {
        unsub = socketService.onProjectUpdated((data) => {
          console.log("✅ projectUpdated event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "taskCreated") {
        unsub = socketService.onTaskCreated((data) => {
          console.log("✅ taskCreated event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "taskDeleted") {
        unsub = socketService.onTaskDeleted((data) => {
          console.log("✅ taskDeleted event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "taskStatusChanged") {
        unsub = socketService.onTaskStatusChanged((data) => {
          console.log("✅ taskStatusChanged event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "staffCreated") {
        unsub = socketService.onStaffCreated((data) => {
          console.log("✅ staffCreated event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "staffDeleted") {
        unsub = socketService.onStaffDeleted((data) => {
          console.log("✅ staffDeleted event received");
          onEvent?.({ type: event, data });
        });
      } else if (event === "staffRoleUpdated") {
        unsub = socketService.onStaffRoleUpdated((data) => {
          console.log("✅ staffRoleUpdated event received");
          onEvent?.({ type: event, data });
        });
      }

      if (unsub) {
        unsubscribersRef.current.push(unsub);
      }
    });

    console.log(`✅ RealTimeProvider listening to ${events.length} events`);

    return cleanup;
  }, [room, events, onEvent]);

  return <>{children}</>;
};

export default RealTimeProvider;
