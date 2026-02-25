import { useEffect, useState } from "react";
import { api } from "../../api";
import "../../styles/Teamcards.css";
import { useProject } from "../../context/ProjectContext";

export default function Team() {
  const { selectedProject } = useProject(); // from header
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (!selectedProject) return;

    const projectId =
      typeof selectedProject === "object"
        ? selectedProject._id
        : selectedProject;

    fetchTeam(projectId);
  }, [selectedProject]);

  const fetchTeam = async (projectId) => {
    try {
      const data = await api(`/projects/${projectId}/team`);
      setTeam(data || []);
    } catch (err) {
      console.error(err);
      setTeam([]);
    }
  };

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Team Members</h2>
      </div>

      <div className="cards-container">
        {team.map((member) => {
          const initials = member.username
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          return (
            <div className="simple-card" key={member._id}>
              {/* Avatar */}
              <div className="avatar-circle">{initials}</div>

              {/* Info */}
              <h3>{member.username}</h3>
              <p className="email">{member.email}</p>

              <span className="role">
  {member.role?.name || member.role || "User"}
</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
