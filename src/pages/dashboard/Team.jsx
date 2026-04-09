// src/pages/dashboard/Team.jsx
// FIXED:
//   1. No loading state — showed blank screen while fetching
//   2. No empty state — showed nothing when project has no members
//   3. No error handling — silent failure on API error

import { useEffect, useState } from "react";
import { api } from "../../api";
import "../../styles/Teamcards.css";
import { useProject } from "../../context/ProjectContext";

export default function Team() {
  const { selectedProject } = useProject();
  const [team, setTeam]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProject) return;
    const projectId = typeof selectedProject === "object"
      ? selectedProject._id
      : selectedProject;
    fetchTeam(projectId);
  }, [selectedProject]);

  const fetchTeam = async (projectId) => {
    try {
      setLoading(true);
      const data = await api(`/projects/${projectId}/team`);
      setTeam(data || []);
    } catch (err) {
      console.error(err);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Team Members</h2>
        {!loading && (
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {team.length} member{team.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="cards-container">
          {[...Array(6)].map((_, i) => (
            <div className="simple-card" key={i}>
              <div
                className="skeleton-box"
                style={{ width: 75, height: 75, borderRadius: "50%", margin: "0 auto 12px" }}
              />
              <div className="skeleton-box" style={{ height: 14, marginBottom: 8 }} />
              <div className="skeleton-box" style={{ height: 12, width: "70%", margin: "0 auto 8px" }} />
              <div className="skeleton-box" style={{ height: 22, width: "50%", margin: "0 auto", borderRadius: 20 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !selectedProject && (
        <div style={{ color: "#94a3b8", fontSize: "14px", padding: "40px 0", textAlign: "center" }}>
          Select a project to view team members.
        </div>
      )}

      {!loading && selectedProject && team.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: "14px", padding: "40px 0", textAlign: "center" }}>
          No team members assigned to this project yet.
        </div>
      )}

      {/* Member cards */}
      {!loading && team.length > 0 && (
        <div className="cards-container">
          {team.map((member) => {
            const initials = member.username
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div className="simple-card" key={member._id}>
                <div className="avatar-circle">{initials}</div>
                <h3>{member.username}</h3>
                <p className="email">{member.email}</p>
                <span className="role">
                  {member.role?.name || member.role || "User"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
