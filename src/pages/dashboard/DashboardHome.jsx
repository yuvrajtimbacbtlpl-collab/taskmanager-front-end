import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api";
import WelcomePopup from "../../components/WelcomePopup";
import "../../styles/DashboardHome.css";

export default function DashboardHome() {
  const location = useLocation();

  const [stats, setStats] = useState({
    totalRoles: 0,
    totalPermissions: 0,
    totalUsers: 0,
    totalTasks: 0,
  });

  const [recent, setRecent] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);

  // ================= FETCH + POPUP =================
useEffect(() => {
  fetchDashboardData();

  const flag = sessionStorage.getItem("showWelcome");

  if (flag === "true") {
    setShowWelcome(true);
    sessionStorage.removeItem("showWelcome");

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 8000); // ✅ 8 seconds

    return () => clearTimeout(timer);
  }
}, []);

  // ================= DASHBOARD DATA =================
  const fetchDashboardData = async () => {
    try {
      const [roles, permissions, users, tasks] = await Promise.all([
        api("/roles"),
        api("/permissions"),
        api("/users"),
        api("/tasks"),
      ]);

      setStats({
        totalRoles: roles.length || 0,
        totalPermissions: permissions.length || 0,
        totalUsers: users.length || 0,
        totalTasks: tasks.length || 0,
      });

      const latestTasks = tasks.slice(-5).reverse();
      setRecent(latestTasks);
    } catch (error) {
      console.error("Dashboard error:", error.message);
    }
  };

  return (
    <div className="dashboard-wrapper">

      {/* ===== WELCOME POPUP ===== */}
      {showWelcome && (
        <WelcomePopup onClose={() => setShowWelcome(false)} />
      )}

      {/* ===== DASHBOARD CONTENT ===== */}
      <div className={`dashboard-home ${showWelcome ? "blurred" : ""}`}>
        <h2 className="dashboard-title">Dashboard Overview</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Roles</h4>
            <p>{stats.totalRoles}</p>
          </div>

          <div className="stat-card">
            <h4>Total Permissions</h4>
            <p>{stats.totalPermissions}</p>
          </div>

          <div className="stat-card">
            <h4>Total Users</h4>
            <p>{stats.totalUsers}</p>
          </div>

          <div className="stat-card">
            <h4>Total Tasks</h4>
            <p>{stats.totalTasks}</p>
          </div>
        </div>

        <div className="recent-section">
          <h3>Recent Tasks</h3>

          {recent.length === 0 ? (
            <p>No recent activity</p>
          ) : (
            recent.map((task) => (
              <div key={task._id} className="recent-item">
                <span>{task.title}</span>
                <span className="recent-time">
                  {new Date(task.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}