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
  const [openProject, setOpenProject] = useState(false);

  const menuRef = useRef(null);
  const projectRef = useRef(null);

  /* ================= FETCH PROJECTS ================= */

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api("/projects");

      const list = Array.isArray(data) ? data : [];
      setProjects(list);

      if (!selectedProject && list.length > 0) {
        setSelectedProject(list[0]);
      }
    } catch (err) {
      console.error("Project fetch error", err);
      setProjects([]);
    }
  };

  /* ================= OUTSIDE CLICK CLOSE ================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (
        projectRef.current &&
        !projectRef.current.contains(target)
      ) {
        setOpenProject(false);
      }

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* ================= LOGOUT ================= */

  const confirmLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
    }
  };

  /* ================= ROLE / TITLE ================= */

  const roleName =
    (user?.role?.name || user?.role || role || "").toUpperCase();

  const dashboardTitle =
    roleName === "ADMIN"
      ? "Admin Dashboard"
      : roleName === "STAFF"
      ? "Staff Dashboard"
      : "Dashboard";

  /* ================= USER INITIAL ================= */

  const initials = user?.username?.charAt(0)?.toUpperCase() || "U";

  /* ================= PROJECT SELECT ================= */

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    // ❌ DO NOT CLOSE HERE
  };

  return (
    <>
      <div className="topbar">
        <h1>{dashboardTitle}</h1>

        <div className="profile-area">

          {/* ================= PROJECT DROPDOWN ================= */}

          <div className="project-wrapper" ref={projectRef}>
            <button
              className="project-btn"
              onClick={() => setOpenProject((prev) => !prev)}
            >
              <div className="project-btn-content">
                <span className="project-label"><b>Project : </b></span>

                <span className="project-btn-name">
                  {selectedProject?.name || "Select Project"}
                </span>
              </div>

              <span
                className={`project-btn-arrow ${
                  openProject ? "rotate" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {openProject && (
              <div
                className="project-dropdown-menu"
                onMouseDown={(e) => e.stopPropagation()}  // ⭐ MAIN FIX
              >
                {/* HEADER */}
                <div className="project-dropdown-header">
                  Your Projects
                </div>

                {/* LIST */}
                <div className="project-dropdown-list">
                  {projects.length === 0 && (
                    <div className="project-empty">
                      No projects found
                    </div>
                  )}

                  {projects.map((p) => {
                    const active = selectedProject?._id === p._id;

                    return (
                      <div
                        key={p._id}
                        className={`project-dropdown-item ${
                          active ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProject(p);
                        }}
                      >
                        <span>{p.name}</span>

                        {active && (
                          <span className="project-check">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DETAILS PANEL */}
                {selectedProject && (
                  <>
                    <div className="project-divider" />

                    <div className="project-info-box">
                      <div className="project-info-title">
                        Project Details
                      </div>

                      <div className="project-info-row">
                        <span>Name:</span>
                        <b>{selectedProject?.name || "N/A"}</b>
                      </div>

                      <div className="project-info-row">
                        <span>Created By:</span>
                        <b>
                          {selectedProject?.createdBy?.username ||
                            "Unknown"}
                        </b>
                      </div>

                      <div className="project-info-row">
                        <span>Email:</span>
                        <b>
                          {selectedProject?.createdBy?.email || "N/A"}
                        </b>
                      </div>

                      <div className="project-info-row">
                        <span>Created:</span>
                        <b>
                          {selectedProject?.createdAt
                            ? new Date(
                                selectedProject.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </b>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ================= PROFILE ================= */}

          <div className="topbar-user-wrapper" ref={menuRef}>
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
              <div
                className="topbar-dropdown"
                onMouseDown={(e) => e.stopPropagation()}
              >
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

      {/* PROFILE MODAL */}
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