import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ListChecks } from "lucide-react";

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Shield,
  KeyRound,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const { hasFeatureAccess } = useAuth();

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Task Manager</h2>

      <div className="menu">
        {/* Dashboard */}
        <NavLink to="/dashboard" end className={linkClass}>
          <LayoutDashboard size={18} className="icon" />
          <span>Dashboard</span>
        </NavLink>

        {/* Staff */}
        {hasFeatureAccess("staff") && (
          <NavLink to="/dashboard/create-staff" className={linkClass}>
            <Users size={18} className="icon" />
            <span>Staff</span>
          </NavLink>
        )}

        {hasFeatureAccess("project") && (
          <NavLink to="/dashboard/projects" className={linkClass}>
            <ClipboardList size={18} className="icon" />
            <span>Projects</span>
          </NavLink>
        )}

        {/* Task */}
        {hasFeatureAccess("task") && (
          <NavLink to="/dashboard/task" className={linkClass}>
            <ClipboardList size={18} className="icon" />
            <span>Task</span>
          </NavLink>
        )}

        {hasFeatureAccess("team") && (
          <NavLink to="/dashboard/team" className={linkClass}>
            <Users size={18} className="icon" />
            <span>Team</span>
          </NavLink>
        )}

        {/* Roles */}
        {hasFeatureAccess("role") && (
          <NavLink to="/dashboard/roles" className={linkClass}>
            <Shield size={18} className="icon" />
            <span>Roles</span>
          </NavLink>
        )}

        {/* Permissions */}
        {hasFeatureAccess("permission") && (
          <NavLink to="/dashboard/permissions" className={linkClass}>
            <KeyRound size={18} className="icon" />
            <span>Permissions</span>
          </NavLink>
        )}

        {/* Task-Status */}

        {hasFeatureAccess("taskStatus") && (
          <NavLink to="/dashboard/task-status" className={linkClass}>
            <ListChecks size={18} className="icon" />
            <span>Task Status</span>
          </NavLink>
        )}
      </div>
    </div>
  );
}
