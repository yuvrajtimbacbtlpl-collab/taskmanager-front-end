import { useEffect, useState, useRef } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import "../../styles/Documents.css";

export default function Documents() {
  const { user } = useAuth();
  const { selectedProject } = useProject();

  const [documents, setDocuments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    if (selectedProject?._id) {
      fetchDocuments(selectedProject._id);
      fetchTeamMembers(selectedProject._id);
    } else {
      setDocuments([]);
      setTeamMembers([]);
    }
  }, [selectedProject]);

  const fetchDocuments = async (projectId) => {
    try {
      const docs = await api(`/projects/${projectId}/documents`);
      setDocuments(docs || []);
    } catch (err) {
      console.error(err);
      setDocuments([]);
    }
  };

  const fetchTeamMembers = async (projectId) => {
    try {
      const members = await api(`/projects/${projectId}/team`);
      setTeamMembers(members || []);
    } catch (err) {
      console.error(err);
      setTeamMembers([]);
    }
  };

  /* ================= CLOSE DROPDOWN OUTSIDE CLICK ================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= UPLOAD ================= */

  const handleUpload = async () => {
    if (!file || !selectedProject || selectedUsers.length === 0) {
      return alert("All fields required");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProject._id);
    formData.append("allowedUsers", JSON.stringify(selectedUsers));

    try {
      setLoading(true);
      await api("/documents", { method: "POST", body: formData });

      setFile(null);
      setSelectedUsers([]);
      fetchDocuments(selectedProject._id);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DOCUMENT CLICK ================= */

  const handleDocumentClick = async (doc) => {
    const ownerId =
      typeof doc.ownerId === "object" ? doc.ownerId._id : doc.ownerId;

    const allowedIds = doc.allowedUsers.map((u) =>
      typeof u === "object" ? u._id : u
    );

    if (ownerId === user.id || allowedIds.includes(user.id)) {
      window.open(doc.url, "_blank");
    } else {
      if (window.confirm("No permission. Send request?")) {
        await api(`/documents/${doc._id}/request-access`, {
          method: "POST",
        });
        alert("Request sent");
      }
    }
  };

  /* ================= UI ================= */

  return (
    <div className="document-page">
      <h2 className="document-title">Documents</h2>

      {/* Upload Section */}
      <div className="document-upload">
        <input
          type="file"
          className="document-input-file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {/* Modern Multi Select */}
        <div className="multi-select" ref={dropdownRef}>
          <div
            className="multi-select-header"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {selectedUsers.length > 0
              ? teamMembers
                  .filter((m) => selectedUsers.includes(m._id))
                  .map((m) => m.username)
                  .join(", ")
              : "Select Team Members"}
          </div>

          {showDropdown && (
            <div className="multi-select-dropdown">
              {teamMembers.map((m) => (
                <label key={m._id} className="multi-select-item">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(m._id)}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      if (checked) {
                        setSelectedUsers([...selectedUsers, m._id]);
                      } else {
                        setSelectedUsers(
                          selectedUsers.filter((id) => id !== m._id)
                        );
                      }
                    }}
                  />
                  <span>{m.username}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          className="document-btn upload-btn"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Documents List */}
      <ul className="document-list">
        {documents.map((doc) => {
          const ownerId =
            typeof doc.ownerId === "object"
              ? doc.ownerId._id
              : doc.ownerId;

          const allowedIds = doc.allowedUsers.map((u) =>
            typeof u === "object" ? u._id : u
          );

          return (
            <li
              key={doc._id}
              className={`document-item ${
                allowedIds.includes(user.id) || ownerId === user.id
                  ? "document-access"
                  : "document-no-access"
              }`}
              onClick={() => handleDocumentClick(doc)}
            >
              {doc.name} {ownerId === user.id && "(You)"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}