import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage";
import RealTimeProvider from "../../components/RealTimeProvider";
import Select from "react-select";
import { MentionsInput, Mention } from "react-mentions";
import { Pencil, Trash2, Eye } from "lucide-react";

/**
 * ProjectsContent - Main content component (separate from real-time logic)
 * This allows real-time updates to propagate properly
 */
function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("success");

  const [form, setForm] = useState({
    name: "",
    description: "",
    members: [],
    type: "Business",
    isActive: true,
  });

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api("/projects");
      setProjects(data || []);
      console.log("📊 Projects fetched:", data?.length || 0);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const data = await api("/users");
      setUsers(data || []);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  // Handle real-time events
  const handleRealTimeEvent = useCallback(({ type, data }) => {
    console.log(`📡 Real-time event: ${type}`);

    // Trigger refresh on any project event
    if (["projectCreated", "projectDeleted", "projectUpdated"].includes(type)) {
      setTimeout(() => {
        fetchProjects();
      }, 100);
    }
  }, [fetchProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        ...form,
        members: form.members.map((m) => m.value),
      };

      if (editingId) {
        await api(`/projects/${editingId}`, { method: "PUT", body });
        setMessage("Project updated successfully");
        setMsgType("warning");
      } else {
        await api("/projects", { method: "POST", body });
        setMessage("Project created successfully");
        setMsgType("success");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", description: "", members: [], type: "Business", isActive: true });
      
      // Refresh after a small delay to let server process
      setTimeout(() => {
        fetchProjects();
      }, 500);
    } catch (err) {
      setMessage(err.message || "Error ❌");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description,
      members: p.members.map((m) => ({ value: m._id, label: m.username })),
      type: p.type || "Business",
      isActive: p.isActive,
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Project?")) return;
    try {
      setSaving(true);
      await api(`/projects/${id}`, { method: "DELETE" });
      setMessage("Project deleted successfully");
      setMsgType("success");
      
      // Refresh after deletion
      setTimeout(() => {
        fetchProjects();
      }, 500);
    } catch (err) {
      setMessage(err.message || "Error ❌");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Project Name",
      accessor: "name",
      render: (value) => <strong>{value}</strong>,
    },
    {
      header: "Type",
      accessor: "type",
      render: (value) => (
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            backgroundColor: getTypeColor(value),
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {value || "Business"}
        </span>
      ),
    },
    {
      header: "Members",
      accessor: "members",
      render: (members) => `${members?.length || 0} members`,
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (value) => (value ? "✅ Active" : "⛔ Inactive"),
    },
  ];

  const actions = (row) => (
    <>
      <button
        className="iconedit"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
      >
        <Pencil size={18} />
      </button>
      <button
        className="icondelete"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row._id);
        }}
      >
        <Trash2 size={18} />
      </button>
      <button
        className="iconview"
        onClick={(e) => {
          e.stopPropagation();
          setViewProject(row);
        }}
      >
        <Eye size={18} />
      </button>
    </>
  );

  const getTypeColor = (type) => {
    const colors = {
      Business: "#3498db",
      Development: "#e74c3c",
      Marketing: "#f39c12",
      HR: "#9b59b6",
      Design: "#1abc9c",
      Other: "#95a5a6",
    };
    return colors[type] || colors.Other;
  };

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Projects</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Create Project
        </button>
      </div>

      {message && (
        <ToastMessage
          message={message}
          type={msgType}
          onClose={() => setMessage("")}
        />
      )}

      {loading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : (
        <CommonTable columns={columns} data={projects} actions={actions} />
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? "Edit Project" : "Create Project"}</h3>
              <span className="modal-close" onClick={() => setShowForm(false)}>
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Project Name</label>
                <input
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Project Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="Business">Business</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Design">Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label>Description (Optional)</label>
                <MentionsInput
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 60, maxHeight: 120 }}
                  placeholder="Type @ to mention a user..."
                >
                  <Mention
                    trigger="@"
                    data={users.map((u) => ({ id: u._id, display: u.username }))}
                    appendSpaceOnAdd={true}
                  />
                </MentionsInput>
              </div>

              <div className="form-field">
                <label>Team Members</label>
                <Select
                  options={users.map((u) => ({ value: u._id, label: u.username }))}
                  isMulti
                  value={form.members}
                  onChange={(selected) => setForm({ ...form, members: selected })}
                  placeholder="Select team members..."
                />
              </div>

              <div className="form-field">
                <label>Status</label>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button type="submit" className="btn-primary full" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Project" : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS */}
      {viewProject && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Project Details</h3>
              <span className="modal-close" onClick={() => setViewProject(null)}>
                ✕
              </span>
            </div>

            <div className="project-details">
              <p>
                <strong>Name:</strong> {viewProject.name}
              </p>
              <p>
                <strong>Type:</strong> {viewProject.type || "Business"}
              </p>
              <p>
                <strong>Status:</strong> {viewProject.isActive ? "Active" : "Inactive"}
              </p>
              <p>
                <strong>Team Members:</strong>{" "}
                {viewProject.members.map((m) => m.username).join(", ")}
              </p>
              <p>
                <strong>Description:</strong>
              </p>
              <p className="description">{viewProject.description || "No description"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Projects - Wrapper component with RealTimeProvider
 * Handles real-time event subscriptions
 */
export default function Projects() {
  return (
    <RealTimeProvider
      room="org_default"
      events={["projectCreated", "projectDeleted", "projectUpdated"]}
      onEvent={({ type }) => {
        console.log(`🔔 Projects page event: ${type}`);
      }}
    >
      <ProjectsContent />
    </RealTimeProvider>
  );
}
