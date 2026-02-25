import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage";
import Select from "react-select";
import { MentionsInput, Mention } from "react-mentions";
import { Pencil, Trash2, Eye } from "lucide-react";

export default function Projects() {
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
    members: [], // array of {value, label} for Select
    isActive: true,
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api("/projects");
      setProjects(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const data = await api("/users");
    setUsers(data || []);
  };

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
      setForm({ name: "", description: "", members: [], isActive: true });
      fetchProjects();
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
      isActive: p.isActive,
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Project?")) return;
    await api(`/projects/${id}`, { method: "DELETE" });
    fetchProjects();
    setMessage("Project deleted successfully");
    setMsgType("error");
  };

  const columns = [
    { header: "Name", accessor: "name" },
    {
      header: "Members",
      render: (row) => row.members.map((m) => m.username).join(", "),
    },
    { header: "Status", render: (row) => (row.isActive ? "Active" : "Inactive") },
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
        <TableSkeleton columns={3} rows={6} />
      ) : (
        <CommonTable columns={columns} data={projects} actions={actions} />
      )}

      {/* ================= CREATE / EDIT FORM ================= */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? "Edit Project" : "Create Project"}</h3>
              <span
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Project Name</label>
                <input
                  value={form.name}
                  required
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label>Description (Optional)</label>
                <MentionsInput
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
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
                  onChange={(selected) =>
                    setForm({ ...form, members: selected })
                  }
                  placeholder="Select team members..."
                />
              </div>

              <div className="form-field">
                <label>Status</label>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary full"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Project"
                  : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW DETAILS ================= */}
      {viewProject && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Project Details</h3>
              <span
                className="modal-close"
                onClick={() => setViewProject(null)}
              >
                ✕
              </span>
            </div>

            <div className="project-details">
              <p>
                <strong>Name:</strong> {viewProject.name}
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
                <br />
                {viewProject.description || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}