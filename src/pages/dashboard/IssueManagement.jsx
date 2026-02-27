import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import socket from "../../socket";
import { Pencil, Trash2, Eye } from "lucide-react";
import TableSkeleton from "../../components/TableSkeleton";
import "../../styles/createform.css";
import ConfirmDelete from "../../components/ConfirmDelete";

const BASE_URL = "http://localhost:4000";

export default function CreateIssue() {
  const { user, hasPermission } = useAuth();
  const { selectedProject } = useProject();

  const canCreate = hasPermission("issue.create");
  const canUpdate = hasPermission("issue.update");
  const canDelete = hasPermission("issue.delete");
  const canRead = hasPermission("issue.read");

  const [issues, setIssues] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [viewIssue, setViewIssue] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "",
    media: [],
  });

  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= SOCKET ================= */

  useEffect(() => {
    if (user?._id) socket.emit("join", user._id);
  }, [user]);

  useEffect(() => {
    if (canRead && selectedProject) {
      fetchIssues();
      fetchStaff();
      fetchStatuses();
    } else {
      setIssues([]);
    }
  }, [canRead, selectedProject]);

  useEffect(() => {
    socket.on("taskCreated", fetchIssues);
    socket.on("taskUpdated", fetchIssues);
    socket.on("taskDeleted", fetchIssues);

    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, []);

  /* ================= FETCH ================= */

  const fetchIssues = async () => {
    if (!selectedProject) return setIssues([]);

    try {
      setLoading(true);
      const data = await api(
        `/tasks?project=${selectedProject._id}&type=issue`,
      );
      setIssues(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    const data = await api("/auth/staff");
    const filtered = (data || []).filter((s) => s._id !== user?._id);
    setStaff(filtered);
  };

  const fetchStatuses = async () => {
    const data = await api("/task-status/active");
    setStatuses(data || []);
  };

  /* ================= FILTER ================= */

  const filteredIssues = issues.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    const matchesStaff =
      !selectedStaff || item.assignedTo?._id === selectedStaff;

    return matchesSearch && matchesStatus && matchesStaff;
  });

  /* ================= FORM ================= */

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      assignedTo: "",
      status: "",
      media: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const showToast = (data) => {
    setMessage(data);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("assignedTo", form.assignedTo);
      formData.append("status", form.status);
      formData.append("type", "issue");

      if (selectedProject) formData.append("project", selectedProject._id);

      form.media.forEach((file) => {
        if (file instanceof File) formData.append("media", file);
      });

      if (editingId) {
        await api(`/tasks/${editingId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        await api("/tasks", {
          method: "POST",
          body: formData,
        });
      }

      showToast({
        type: editingId ? "toast-warning" : "toast-success",
        title: editingId ? "Issue Updated" : "Issue Created",
        text: editingId
          ? "Issue updated successfully."
          : "New issue created successfully.",
        icon: editingId ? "✏️" : "🐞",
      });

      resetForm();
      fetchIssues();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title || "",
      description: item.description || "",
      assignedTo: item.assignedTo?._id || "",
      status: item.status || "",
      media: item.media || [],
    });

    setEditingId(item._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api(`/tasks/${deleteId}`, { method: "DELETE" });

      showToast({
        type: "toast-error",
        title: "Issue Deleted",
        text: "Issue removed successfully.",
        icon: "🗑️",
      });

      fetchIssues();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const updateInline = async (row, updates) => {
    const formData = new FormData();

    formData.append("title", row.title);
    formData.append("description", row.description);
    formData.append("assignedTo", updates.assignedTo || row.assignedTo?._id);
    formData.append("status", updates.status || row.status);
    formData.append("type", "issue");

    if (selectedProject) formData.append("project", selectedProject._id);

    await api(`/tasks/${row._id}`, {
      method: "PUT",
      body: formData,
    });

    fetchIssues();
  };

  /* ================= TABLE ================= */

  const columns = [
    { header: "Title", accessor: "title" },
    {
      header: "Status",
      render: (row) => (
        <select
          className="table-select"
          value={row.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateInline(row, { status: e.target.value })}
        >
          {statuses.map((s) => (
            <option key={s._id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Assigned To",
      render: (row) => (
        <select
          className="table-select"
          value={row.assignedTo?._id || ""}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateInline(row, { assignedTo: e.target.value })}
        >
          <option value="">Select User</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.username}
            </option>
          ))}
        </select>
      ),
    },
  ];

  const actions =
    canUpdate || canDelete || canRead
      ? (row) => (
          <>
            {canUpdate && (
              <button
                className="iconedit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <Pencil size={18} />
              </button>
            )}

            {canDelete && (
              <button
                className="icondelete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(row._id);
                }}
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              className="iconview"
              onClick={(e) => {
                e.stopPropagation();
                setViewIssue(row);
              }}
            >
              <Eye size={18} />
            </button>
          </>
        )
      : null;

  if (!canRead)
    return (
      <div className="permission-page">
        <h3>No Permission to view issues</h3>
      </div>
    );

  return (
    <div className="permission-page">
      {/* ✅ TOAST MESSAGE */}
      {message && (
        <div className={`toast-card ${message.type}`}>
          <div className="toast-content">
            <span className="toast-icon">{message.icon}</span>
            <div>
              <div className="toast-title">{message.title}</div>
              <div className="toast-message">{message.text}</div>
            </div>
          </div>
          <button className="toast-close" onClick={() => setMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="page-header">
        <h2>Issue Management</h2>

        {canCreate && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
          >
            + Create Issue
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-left">
          <input
            type="text"
            placeholder="Search title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-right-group">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
          >
            <option value="">All Staff</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <TableSkeleton columns={3} rows={6} />
      ) : (
        <CommonTable
          columns={columns}
          data={filteredIssues}
          actions={actions}
        />
      )}

      {/* VIEW ISSUE MODAL */}
      {viewIssue && (
        <div className="staff-overlay">
          <div className="staff-form-card">
            <div className="staff-form-header">
              <h3>Issue Details</h3>
              <span className="close-btn" onClick={() => setViewIssue(null)}>
                ✕
              </span>
            </div>

            <div className="task-details">
              <p>
                <strong>Title:</strong> {viewIssue.title}
              </p>

              <p>
                <strong>Description:</strong> {viewIssue.description}
              </p>

              <p>
                <strong>Status:</strong> {viewIssue.status}
              </p>

              <p>
                <strong>Assigned To:</strong>{" "}
                {viewIssue.assignedTo?.username || "-"}
              </p>

              {viewIssue.media && viewIssue.media.length > 0 && (
                <div
                  style={{
                    marginTop: 15,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {viewIssue.media.map((file, index) => (
                    <div key={index}>
                      {file.match(/\.(mp4|mov|webm)$/i) ? (
                        <video
                          src={`${BASE_URL}/uploads/${file}`}
                          width="300"
                          controls
                        />
                      ) : (
                        <img
                          src={`${BASE_URL}/uploads/${file}`}
                          width="250"
                          alt="issue"
                          style={{ borderRadius: 6 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="staff-overlay">
          <div className="staff-form-card">
            <div className="staff-form-header">
              <h3>{editingId ? "Edit Issue" : "Create Issue"}</h3>
              <span className="close-btn" onClick={resetForm}>
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TITLE */}
              <div className="field">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div className="field">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* ASSIGNED */}
              <div className="field">
                <label>Assign To</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  required
                >
                  <option value="">Select Staff</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS */}
              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  {statuses.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* MEDIA */}
              <div className="field">
                <label>Upload Images / Videos</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    setForm({
                      ...form,
                      media: [...form.media, ...Array.from(e.target.files)],
                    });
                  }}
                />

                <div className="media-preview">
                  {(form.media || []).map((file, index) => {
                    const url =
                      file instanceof File
                        ? URL.createObjectURL(file)
                        : `${BASE_URL}/uploads/${file}`;

                    const isVideo = (file.name || file).match(
                      /\.(mp4|mov|webm)$/i,
                    );

                    return (
                      <div key={index} className="media-item">
                        {isVideo ? (
                          <video src={url} controls width="150" />
                        ) : (
                          <img src={url} alt="preview" width="150" />
                        )}

                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => {
                            const updated = [...form.media];
                            updated.splice(index, 1);
                            setForm({ ...form, media: updated });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="btn-primary full">
                {editingId ? "Update Issue" : "Create Issue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteId && (
        <ConfirmDelete
          title="Delete Issue"
          message="This issue will be permanently removed."
          loading={deleting}
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
