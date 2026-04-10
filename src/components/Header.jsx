// src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import ProfileModal from "./ProfileModal";
import ConfirmDelete from "./ConfirmDelete";
import NotificationBell from "./NotificationBell";
import { api } from "../api";
import { useProject } from "../context/ProjectContext";
import socketService from "../services/socketService";
import { GLOBAL_COMPANY } from "../hooks/useCompany";
import "../styles/topbar.css";

export default function Header({ role, user, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);

  const {
    selectedProject,
    setSelectedProject,
    selectedCompany,
    setSelectedCompany,
  } = useProject();

  const [openMenu, setOpenMenu] = useState(false);
  const [openProject, setOpenProject] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);

  const menuRef = useRef(null);
  const projectRef = useRef(null);
  const companyRef = useRef(null);

  const roleName = (user?.role?.name || user?.role || role || "").toUpperCase();
  const isAdmin = roleName === "ADMIN";
  const isGlobal = isAdmin && selectedCompany?._id === "global";
  const initials  = user?.username?.charAt(0)?.toUpperCase() || "U";
  const BASE_URL  = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";
  const avatarSrc = user?.image
    ? (user.image.startsWith("http") ? user.image : `${BASE_URL}/${user.image}`)
    : null;
  const dashboardTitle = isAdmin ? "Admin Dashboard" : roleName === "STAFF" ? "Staff Dashboard" : "Dashboard";

  // ── Fetch companies (ADMIN only) ─────────────────────────
  const fetchCompanies = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await api("/company");
      const list = Array.isArray(data) ? data : [];
      setCompanies(list);
      // Auto-select Global on first load if nothing selected
      if (!selectedCompany) {
        setSelectedCompany(GLOBAL_COMPANY);
      }
    } catch {
      setCompanies([]);
    }
  }, [isAdmin, selectedCompany, setSelectedCompany]);

  // ── Fetch projects ────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      let url = "/projects";
      if (isAdmin) {
        if (isGlobal) {
          // Global: show all projects (no company filter)
          // Or show none — projects must belong to a company, global doesn't apply
          setProjects([]);
          setSelectedProject(null);
          return;
        }
        const companyId = selectedCompany?._id;
        if (companyId) url += `?company=${companyId}`;
      }

      const data = await api(url);
      const list = Array.isArray(data) ? data : [];
      setProjects(list);

      if (list.length > 0) {
        const stillInList = list.find((p) => p._id === selectedProject?._id);
        if (!selectedProject || !stillInList) setSelectedProject(list[0]);
      } else {
        setSelectedProject(null);
      }
    } catch {
      setProjects([]);
    }
  }, [isAdmin, isGlobal, selectedCompany, selectedProject?._id, setSelectedProject]);

  useEffect(() => {
    if (isAdmin) fetchCompanies();
  }, [fetchCompanies, isAdmin]);

  useEffect(() => {
    fetchProjects();
    const u1 = socketService.onProjectUpdated(() => fetchProjects());
    const u2 = socketService.onProjectDeleted(() => fetchProjects());
    const u3 = socketService.onProjectCreated(() => fetchProjects());
    return () => { u1?.(); u2?.(); u3?.(); };
  }, [fetchProjects]);

  // ── Click outside ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (projectRef.current && !projectRef.current.contains(e.target)) setOpenProject(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
      if (companyRef.current && !companyRef.current.contains(e.target)) setOpenCompany(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setSelectedProject(null);
    setOpenCompany(false);
  };

  return (
    <>
      <div className="topbar">
        <h1>{dashboardTitle}</h1>

        <div className="profile-area">

          {/* ── COMPANY SELECTOR (ADMIN only) ── */}
          {isAdmin && (
            <div className="project-wrapper" ref={companyRef} style={{ marginRight: "8px" }}>
              <button
                className="project-btn"
                onClick={() => setOpenCompany((p) => !p)}
                style={{ borderColor: isGlobal ? "#10b981" : "#8b5cf6" }}
              >
                <div className="project-btn-content">
                  <span className="project-label"><b>Company : </b></span>
                  <span className="project-btn-name">
                    {isGlobal ? "🌐 Global" : (selectedCompany?.name || "Select Company")}
                  </span>
                </div>
                <span className={`project-btn-arrow ${openCompany ? "rotate" : ""}`}>▾</span>
              </button>

              {openCompany && (
                <div className="project-dropdown-menu" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="project-dropdown-header">Select Scope</div>

                  <div className="project-dropdown-list">
                    {/* ── GLOBAL OPTION ── */}
                    <div
                      className={`project-dropdown-item ${isGlobal ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); handleCompanySelect(GLOBAL_COMPANY); }}
                      style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "4px" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px" }}>🌐</span>
                        <span>
                          <strong>Global</strong>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "normal" }}>
                            Visible to all companies
                          </div>
                        </span>
                      </span>
                      {isGlobal && <span className="project-check">✓</span>}
                    </div>

                    {/* ── COMPANY LIST ── */}
                    {companies.length === 0 && (
                      <div className="project-empty">No companies found</div>
                    )}
                    {companies.map((c) => {
                      const active = !isGlobal && selectedCompany?._id === c._id;
                      return (
                        <div
                          key={c._id}
                          className={`project-dropdown-item ${active ? "active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); handleCompanySelect(c); }}
                        >
                          <span>{c.name}</span>
                          {active && <span className="project-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── SELECTED INFO BOX ── */}
                  {isGlobal ? (
                    <>
                      <div className="project-divider" />
                      <div className="project-info-box">
                        <div className="project-info-title">🌐 Global Scope</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", padding: "4px 0" }}>
                          Roles, statuses, and permissions created here are shared across <strong>all companies</strong>.
                        </div>
                      </div>
                    </>
                  ) : selectedCompany && !isGlobal && (
                    <>
                      <div className="project-divider" />
                      <div className="project-info-box">
                        <div className="project-info-title">Company Details</div>
                        <div className="project-info-row">
                          <span>Name:</span><b>{selectedCompany?.name || "N/A"}</b>
                        </div>
                        <div className="project-info-row">
                          <span>Email:</span><b>{selectedCompany?.email || "N/A"}</b>
                        </div>
                        <div className="project-info-row">
                          <span>Status:</span>
                          <b>{selectedCompany?.status === 1 ? "Active" : "Inactive"}</b>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PROJECT SELECTOR ── */}
          {!isGlobal && (
            <div className="project-wrapper" ref={projectRef}>
              <button className="project-btn" onClick={() => setOpenProject((p) => !p)}>
                <div className="project-btn-content">
                  <span className="project-label"><b>Project : </b></span>
                  <span className="project-btn-name">
                    {selectedProject?.name || "Select Project"}
                  </span>
                </div>
                <span className={`project-btn-arrow ${openProject ? "rotate" : ""}`}>▾</span>
              </button>

              {openProject && (
                <div className="project-dropdown-menu" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="project-dropdown-header">
                    {isAdmin && selectedCompany
                      ? `${selectedCompany.name}'s Projects`
                      : "Your Projects"}
                  </div>

                  <div className="project-dropdown-list">
                    {projects.length === 0 && (
                      <div className="project-empty">
                        {isAdmin && !selectedCompany ? "Select a company first" : "No projects found"}
                      </div>
                    )}
                    {projects.map((p) => {
                      const active = selectedProject?._id === p._id;
                      const isInactive = p.isActive === false || String(p.status).toLowerCase() === "inactive";
                      return (
                        <div
                          key={p._id}
                          className={`project-dropdown-item ${active ? "active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setOpenProject(false); }}
                        >
                          <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span>{p.name}</span>
                            {isAdmin && isInactive && (
                              <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: "bold" }}>[INACTIVE]</span>
                            )}
                          </span>
                          {active && <span className="project-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  {selectedProject && (
                    <>
                      <div className="project-divider" />
                      <div className="project-info-box">
                        <div className="project-info-title">Project Details</div>
                        <div className="project-info-row">
                          <span>Name:</span><b>{selectedProject?.name || "N/A"}</b>
                        </div>
                        <div className="project-info-row">
                          <span>Created By:</span><b>{selectedProject?.createdBy?.username || "Unknown"}</b>
                        </div>
                        <div className="project-info-row">
                          <span>Created:</span>
                          <b>{selectedProject?.createdAt
                            ? new Date(selectedProject.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "N/A"}</b>
                        </div>
                        {isAdmin && (
                          <div className="project-info-row">
                            <span>Company:</span>
                            <b>{selectedProject?.company?.name || selectedCompany?.name || "N/A"}</b>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATION BELL ── */}
          <NotificationBell />

          {/* ── USER MENU ── */}
          <div className="topbar-user-wrapper" ref={menuRef}>
            <button className="topbar-profile-btn" onClick={() => setOpenMenu(!openMenu)}>
              <span className="topbar-username">{user?.username || "User"}</span>
              <div className="topbar-avatar-circle">
                {avatarSrc
                  ? <img src={avatarSrc} alt="" style={{width:"100%",height:"100%",borderRadius:"inherit",objectFit:"cover"}}/>
                  : initials}
              </div>
            </button>

            {openMenu && (
              <div className="topbar-dropdown" onMouseDown={(e) => e.stopPropagation()}>
                <div className="dropdown-user">
                  <div className="dropdown-avatar">
                    {avatarSrc
                      ? <img src={avatarSrc} alt="" style={{width:"100%",height:"100%",borderRadius:"inherit",objectFit:"cover"}}/>
                      : initials}
                  </div>
                  <div>
                    <div className="dropdown-name">{user?.username}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item" onClick={() => { setShowProfile(true); setOpenMenu(false); }}>Profile</div>
                <div className="dropdown-item logout" onClick={() => { setShowLogoutConfirm(true); setOpenMenu(false); }}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showLogoutConfirm && (
        <ConfirmDelete
          title="Logout?"
          message="You will be signed out of your account."
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
        />
      )}
    </>
  );
}
