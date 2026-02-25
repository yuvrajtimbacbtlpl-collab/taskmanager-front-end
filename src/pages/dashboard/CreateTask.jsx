import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext"; // ✅ project context
import socket from "../../socket";
import { Pencil, Trash2, Eye } from "lucide-react";
import TableSkeleton from "../../components/TableSkeleton";
import "../../styles/createform.css";
import ConfirmDelete from "../../components/ConfirmDelete";

const BASE_URL = "http://localhost:4000";

export default function CreateTask() {
  const { user, hasPermission } = useAuth();
  const { selectedProject } = useProject(); // ✅ get selected project

  const canCreate = hasPermission("task.create");
  const canUpdate = hasPermission("task.update");
  const canDelete = hasPermission("task.delete");
  const canRead = hasPermission("task.read");

  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [viewTask, setViewTask] = useState(null);

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

  /* ================= SOCKET JOIN ================= */
  useEffect(() => {
    if (user?._id) socket.emit("join", user._id);
  }, [user]);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (canRead && selectedProject) {
      fetchTasks();
      fetchStaff();
      fetchStatuses();
    } else {
      setTasks([]); // clear tasks if no project selected
    }
  }, [canRead, selectedProject]); // ✅ re-fetch when selectedProject changes

  useEffect(() => {
    socket.on("taskCreated", fetchTasks);
    socket.on("taskUpdated", fetchTasks);
    socket.on("taskDeleted", fetchTasks);
    socket.on("staffUpdated", fetchStaff);

    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
      socket.off("staffUpdated");
    };
  }, []);

  const fetchTasks = async () => {
    if (!selectedProject) return setTasks([]);
    try {
      setLoading(true);
      const data = await api(`/tasks?project=${selectedProject._id}`);
      setTasks(data || []);
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

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesStaff =
      !selectedStaff || task.assignedTo?._id === selectedStaff;
    return matchesSearch && matchesStatus && matchesStaff;
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("assignedTo", form.assignedTo);
      formData.append("status", form.status);
      formData.append("priority", form.priority || "Normal");
      if (form.dueDate) formData.append("dueDate", form.dueDate);
      if (selectedProject) formData.append("project", selectedProject._id); // ✅ attach project

      form.media.forEach((file) => {
        if (file instanceof File) formData.append("media", file);
      });

      if (editingId) {
        api(`/tasks/${editingId}`, { method: "PUT", body: formData });
      } else {
        api("/tasks", { method: "POST", body: formData });
      }

      setMessage({
        type: editingId ? "toast-warning" : "toast-success",
        title: editingId ? "Task Updated" : "Task Created",
        text: editingId
          ? "Your task has been updated successfully."
          : "New task has been created successfully.",
        icon: editingId ? "✏️" : "✅",
      });

      setTimeout(() => setMessage(null), 4000);
      resetForm();
      fetchTasks();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleEdit = (task) => {
    setViewTask(null);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || "",
      status: task.status || "",
      media: task.media || [],
    });
    setEditingId(task._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      await api(`/tasks/${deleteId}`, { method: "DELETE" });

      setMessage({
        type: "toast-error",
        title: "Task Deleted",
        text: "The task has been removed successfully.",
        icon: "🗑️",
      });

      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const updateTaskInline = async (row, updates) => {
    const formData = new FormData();
    formData.append("title", row.title);
    formData.append("description", row.description);
    formData.append("assignedTo", updates.assignedTo || row.assignedTo?._id);
    formData.append("status", updates.status || row.status);
    if (selectedProject) formData.append("project", selectedProject._id); // ✅ attach project

    await api(`/tasks/${row._id}`, { method: "PUT", body: formData });
    fetchTasks();
  };

  const columns = [
    { header: "Title", accessor: "title" },
    {
      header: "Status",
      render: (row) => (
        <select
          className="table-select"
          value={row.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateTaskInline(row, { status: e.target.value })}
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
          onChange={(e) =>
            updateTaskInline(row, { assignedTo: e.target.value })
          }
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
                  handleDelete(row._id);
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              className="iconview"
              onClick={(e) => {
                e.stopPropagation();
                setViewTask(row);
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
        <h3>No Permission to view tasks</h3>
      </div>
    );

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Task Management</h2>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
          >
            + Create Task
          </button>
        )}
      </div>

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

      {loading ? (
        <TableSkeleton columns={3} rows={6} />
      ) : (
        <CommonTable columns={columns} data={filteredTasks} actions={actions} />
      )}

      {/* VIEW MODAL */}
      {viewTask && (
        <div className="staff-overlay">
          <div className="staff-form-card">
            <div className="staff-form-header">
              <h3>Task Details</h3>
              <span className="close-btn" onClick={() => setViewTask(null)}>
                ✕
              </span>
            </div>
            <div className="task-details">
              <p>
                <strong>Title:</strong> {viewTask.title}
              </p>
              <p>
                <strong>Description:</strong> {viewTask.description}
              </p>
              <p>
                <strong>Status:</strong> {viewTask.status}
              </p>
              <p>
                <strong>Assigned To:</strong> {viewTask.assignedTo?.username}
              </p>
              {viewTask.media && viewTask.media.length > 0 && (
                <div
                  style={{
                    marginTop: 15,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {viewTask.media.map((file, index) => (
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
                          alt="task"
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
              <h3>{editingId ? "Edit Task" : "Create Task"}</h3>
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
                {editingId ? "Update Task" : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <ConfirmDelete
          title="Delete Task"
          message="This task will be permanently removed. This action cannot be undone."
          loading={deleting}
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
