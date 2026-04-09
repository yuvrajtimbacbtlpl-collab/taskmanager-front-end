// src/pages/dashboard/DashboardHome.jsx
import { useEffect, useState } from "react";
import { useAuth }    from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import { useLocation, NavLink } from "react-router-dom";
import { api } from "../../api";
import WelcomePopup from "../../components/WelcomePopup";
import {
  Users, Shield, KeyRound, CheckSquare,
  FolderKanban, ListChecks, AlertCircle, MessageSquare,
} from "lucide-react";
import "../../styles/DashboardHome.css";

function fmtDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function DashboardHome() {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, selectedCompany } = useCompany();

  const [stats, setStats] = useState({
    totalRoles: 0, totalPermissions: 0, totalUsers: 0,
    totalTasks: 0, totalProjects: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => { if (isAdmin) fetchData(); }, [selectedCompany]);

  useEffect(() => {
    fetchData();
    const flag = sessionStorage.getItem("showWelcome");
    if (flag === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("showWelcome");
      const t = setTimeout(() => setShowWelcome(false), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoadingStats(true);
      const [roles, perms, users, projects, tasks] = await Promise.allSettled([
        api("/roles"),
        api("/permissions"),
        api("/auth/staff"),
        api("/projects"),
        api("/tasks?limit=5"),
      ]);
      const rv = (r) => (r.status === "fulfilled" ? r.value : null);
      const rolesData    = rv(roles);
      const permsData    = rv(perms);
      const usersData    = rv(users);
      const projectsData = rv(projects);
      const tasksRes     = rv(tasks);

      setStats({
        totalRoles:       Array.isArray(rolesData)    ? rolesData.length    : 0,
        totalPermissions: Array.isArray(permsData)    ? permsData.length    : 0,
        totalUsers:       Array.isArray(usersData)    ? usersData.length    : usersData?.total ?? 0,
        totalProjects:    Array.isArray(projectsData) ? projectsData.length : 0,
        totalTasks:       tasksRes?.totalRecords ?? (Array.isArray(tasksRes) ? tasksRes.length : 0),
      });

      const taskArr = tasksRes?.data ?? (Array.isArray(tasksRes) ? tasksRes : []);
      setRecent(taskArr.slice(0, 5));
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const statCards = [
    { label: "Projects",    value: stats.totalProjects,    icon: FolderKanban, color: "#6366f1" },
    { label: "Tasks",       value: stats.totalTasks,       icon: CheckSquare,  color: "#0ea5e9" },
    { label: "Staff",       value: stats.totalUsers,       icon: Users,        color: "#10b981" },
    { label: "Roles",       value: stats.totalRoles,       icon: Shield,       color: "#f59e0b" },
    { label: "Permissions", value: stats.totalPermissions, icon: KeyRound,     color: "#ec4899" },
  ];

  const quickLinks = [
    { to: "/dashboard/task",        icon: "✅", label: "New Task",     color: "#eef2ff" },
    { to: "/dashboard/projects",    icon: "📁", label: "Projects",     color: "#f0fdf4" },
    { to: "/dashboard/create-staff",icon: "👤", label: "Staff",        color: "#fef9c3" },
    { to: "/dashboard/chat",        icon: "💬", label: "Chat",         color: "#e0f2fe" },
    { to: "/dashboard/issues",      icon: "🐛", label: "Issues",       color: "#fff1f2" },
    { to: "/dashboard/task-status", icon: "🏷️", label: "Task Status",  color: "#f5f3ff" },
  ];

  return (
    <div className="dashboard-wrapper">
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}

      <div className={`dashboard-home ${showWelcome ? "blurred" : ""}`}>

        {/* Welcome bar */}
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-left">
            <h2 className="dashboard-title">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.username?.split(" ")[0] || "there"} 👋
            </h2>
            <p className="dashboard-subtitle">
              Here's what's happening{isAdmin && selectedCompany?.name ? ` at ${selectedCompany.name}` : ""} today.
            </p>
          </div>
          <div className="dashboard-date-chip">
            📅 <span>{fmtDate()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                className="stat-card"
                key={card.label}
                style={{ "--stat-color": card.color }}
              >
                <div
                  className="stat-icon"
                  style={{ background: card.color + "18", color: card.color }}
                >
                  <Icon size={22} />
                </div>
                <div className="stat-info">
                  <h4>{card.label}</h4>
                  <p>
                    {loadingStats
                      ? <span className="skeleton-box" style={{ width: 44, height: 28 }} />
                      : card.value.toLocaleString()
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lower two-column */}
        <div className="dash-lower">

          {/* Recent Tasks */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Recent Tasks</h3>
              {recent.length > 0 && (
                <span className="dash-section-badge">{recent.length}</span>
              )}
            </div>

            {loadingStats ? (
              [1,2,3].map((k) => (
                <div className="recent-item" key={k}>
                  <div className="recent-item-left">
                    <div className="skeleton-box" style={{ width: "70%", height: 13 }} />
                    <div className="skeleton-box" style={{ width: "40%", height: 11, marginTop: 5 }} />
                  </div>
                  <div className="skeleton-box" style={{ width: 52, height: 20, borderRadius: 20 }} />
                </div>
              ))
            ) : recent.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13.5, padding: "16px 0" }}>
                No tasks yet — create your first task to get started.
              </div>
            ) : (
              recent.map((task) => (
                <div className="recent-item" key={task._id}>
                  <div className="recent-item-left">
                    <span className="recent-item-title">
                      <span className={`priority-dot ${task.priority || "Normal"}`} />
                      {task.title}
                    </span>
                    <span className="recent-item-sub">
                      {task.assignedTo?.username
                        ? `→ ${task.assignedTo.username}`
                        : "Unassigned"}
                    </span>
                  </div>
                  <div className="recent-item-right">
                    <span className="recent-item-time">{timeAgo(task.createdAt)}</span>
                    {task.status && (
                      <span className="recent-item-status">{task.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Links */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Quick Access</h3>
            </div>
            <div className="quick-links-grid">
              {quickLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className="quick-link-btn">
                  <div className="quick-link-icon" style={{ background: link.color }}>
                    {link.icon}
                  </div>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
