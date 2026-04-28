import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useGlobalSocket } from "../context/GlobalSocketProvider";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  FileText,
  UsersRound,
  Shield,
  KeyRound,
  ListChecks,
  Building2,
  MessageSquare,
  Timer,
} from "lucide-react";

export default function Sidebar() {
  const { hasFeatureAccess } = useAuth();
  const { socket } = useGlobalSocket();
  const [chatUnread, setChatUnread] = useState(0);

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  // Listen for incoming chat notifications to bump the badge
  useEffect(() => {
    if (!socket) return;
    const onChatNotif = () => {
      // Only bump if not currently on chat page
      if (!window.location.pathname.includes("/chat")) {
        setChatUnread((n) => n + 1);
      }
    };
    socket.on("chatNotification", onChatNotif);
    return () => socket.off("chatNotification", onChatNotif);
  }, [socket]);

  // Reset badge when user navigates to chat
  const handleChatClick = () => setChatUnread(0);

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo-row">
        <div className="sidebar-logo-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <div className="sidebar-title">Task Manager</div>
          <div className="sidebar-subtitle">WORKSPACE</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>

        <NavLink to="/dashboard" end className={linkClass}>
          <LayoutDashboard size={16} className="icon" />
          <span>Dashboard</span>
        </NavLink>

        {hasFeatureAccess("company") && (
          <NavLink to="/dashboard/companies" className={linkClass}>
            <Building2 size={16} className="icon" />
            <span>Companies</span>
          </NavLink>
        )}

        {hasFeatureAccess("project") && (
          <NavLink to="/dashboard/projects" className={linkClass}>
            <FolderKanban size={16} className="icon" />
            <span>Projects</span>
          </NavLink>
        )}

        {hasFeatureAccess("staff") && (
          <NavLink to="/dashboard/create-staff" className={linkClass}>
            <Users size={16} className="icon" />
            <span>Staff</span>
          </NavLink>
        )}

        <div className="sidebar-section-label">Work</div>

        {hasFeatureAccess("task") && (
          <NavLink to="/dashboard/task" className={linkClass}>
            <CheckSquare size={16} className="icon" />
            <span>Tasks</span>
          </NavLink>
        )}

        {hasFeatureAccess("issue") && (
          <NavLink to="/dashboard/issues" className={linkClass}>
            <AlertCircle size={16} className="icon" />
            <span>Issues</span>
          </NavLink>
        )}

        {hasFeatureAccess("document") && (
          <NavLink to="/dashboard/documents" className={linkClass}>
            <FileText size={16} className="icon" />
            <span>Documents</span>
          </NavLink>
        )}

        <NavLink
          to="/dashboard/chat"
          className={linkClass}
          onClick={handleChatClick}
        >
          <MessageSquare size={16} className="icon" />
          <span>Chat</span>
          {chatUnread > 0 && (
            <span className="chat-nav-badge">
              {chatUnread > 99 ? "99+" : chatUnread}
            </span>
          )}
        </NavLink>

        <NavLink to="/dashboard/timesheet" className={linkClass}>
          <Timer size={16} className="icon" />
          <span>Timesheet</span>
        </NavLink>

        {hasFeatureAccess("team") && (
          <NavLink to="/dashboard/team" className={linkClass}>
            <UsersRound size={16} className="icon" />
            <span>Team</span>
          </NavLink>
        )}

        <div className="sidebar-section-label">Settings</div>

        {hasFeatureAccess("role") && (
          <NavLink to="/dashboard/roles" className={linkClass}>
            <Shield size={16} className="icon" />
            <span>Roles</span>
          </NavLink>
        )}

        {hasFeatureAccess("permission") && (
          <NavLink to="/dashboard/permissions" className={linkClass}>
            <KeyRound size={16} className="icon" />
            <span>Permissions</span>
          </NavLink>
        )}

        {hasFeatureAccess("taskStatus") && (
          <NavLink to="/dashboard/task-status" className={linkClass}>
            <ListChecks size={16} className="icon" />
            <span>Task Status</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0 · Task Manager Pro</div>
      </div>
    </div>
  );
}
