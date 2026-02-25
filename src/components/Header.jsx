import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import { api } from "../api";
import { useProject } from "../context/ProjectContext";
import "../styles/topbar.css";

export default function Header({ role, user, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [projects, setProjects] = useState([]);
  const { selectedProject, setSelectedProject } = useProject();

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    fetchProjects();
  }, []);

  /* Close dropdown outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProjects = async () => {
    const data = await api("/projects");
    setProjects(data || []);
    if (!selectedProject && data.length > 0) {
      setSelectedProject(data[0]);
    }
  };

  const confirmLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
    }
  };

  const roleName =
    (user?.role?.name || user?.role || role || "").toUpperCase();

  const dashboardTitle =
    roleName === "ADMIN"
      ? "Admin Dashboard"
      : roleName === "STAFF"
      ? "Staff Dashboard"
      : "Dashboard";

  const initials =
    user?.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <div className="topbar">
        <h1>{dashboardTitle}</h1>

        <div className="profile-area">

          <select
            value={selectedProject?._id || ""}
            onChange={(e) =>
              setSelectedProject(
                projects.find((p) => p._id === e.target.value)
              )
            }
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* PROFILE BUTTON */}
          <div
            className="topbar-user-wrapper"
            ref={menuRef}
          >
            <button
              className="topbar-profile-btn"
              onClick={() => setOpenMenu(!openMenu)}
            >
              <span className="topbar-username">
                {user?.username || "User"}
              </span>

              <div className="topbar-avatar-circle">
                {initials}
              </div>
            </button>

            {openMenu && (
              <div className="topbar-dropdown">

                <div className="dropdown-user">
                  <div className="dropdown-avatar">
                    {initials}
                  </div>

                  <div>
                    <div className="dropdown-name">
                      {user?.username}
                    </div>
                    <div className="dropdown-email">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfile(true);
                    setOpenMenu(false);
                  }}
                >
                  Profile
                </div>

                <div
                  className="dropdown-item logout"
                  onClick={confirmLogout}
                >
                  Logout
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {showProfile && (
        <ProfileModal
          user={user}
          role={roleName}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}