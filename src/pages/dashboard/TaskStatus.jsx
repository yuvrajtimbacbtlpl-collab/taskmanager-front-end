import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import { useAuth } from "../../context/AuthContext";
import { Pencil, Trash2 } from "lucide-react";
import ToastMessage from "../../components/ToastMessage";
import ConfirmDelete from "../../components/ConfirmDelete";

export default function TaskStatus() {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission("taskStatus.create");
  const canUpdate = hasPermission("taskStatus.update");
  const canDelete = hasPermission("taskStatus.delete");
  const canRead = hasPermission("taskStatus.read");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    isActive: true,
  });

  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api("/task-status");
      setData(res || []);
    } catch (err) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) fetchData();
  }, [canRead]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api(`/task-status/${editingId}`, {
          method: "PUT",
          body: form,
        });

        setToast({
          id: Date.now(),
          type: "warning", // 🟡 Update
          message: "Status updated successfully",
        });
      } else {
        await api("/task-status", {
          method: "POST",
          body: form,
        });

        setToast({
          id: Date.now(),
          type: "success", // 🟢 Create
          message: "Status created successfully",
        });
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", isActive: true });

      fetchData();
    } catch (err) {
      setToast({
        id: Date.now(),
        type: "error", // 🔴 Error
        message: "Operation failed",
      });
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name,
      isActive: row.isActive,
    });
    setShowForm(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = (id) => {
    setDeleteId(id); // show confirmation modal
  };

  const confirmDelete = async () => {
    try {
      await api(`/task-status/${deleteId}`, { method: "DELETE" });

      setToast({
        id: Date.now(),
        type: "error", // 🔴 Delete
        message: "Status deleted successfully",
      });

      setDeleteId(null);
      fetchData();
    } catch (err) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Failed to delete status",
      });
    }
  };

  /* ================= TABLE ================= */

  const columns = [
    { header: "Name", accessor: "name" },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`status-badge ${
            row.isActive ? "active" : "inactive"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions =
    canUpdate || canDelete
      ? (row) => (
          <div style={{ display: "flex", gap: "10px" }}>
            {canUpdate && (
              <button
                className="iconedit"
                onClick={() => handleEdit(row)}
                title="Edit"
              >
                <Pencil size={18} />
              </button>
            )}

            {canDelete && (
              <button
                className="icondelete"
                onClick={() => handleDelete(row._id)}
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )
      : null;

  if (!canRead) return <h3>No Permission</h3>;

  /* ================= UI ================= */

  return (
    <div className="permission-page">
      {/* HEADER */}
      <div className="page-header">
        <h2>Task Status</h2>

        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({ name: "", isActive: true });
            }}
          >
            + Create Status
          </button>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* TABLE */}
      <div className={showForm ? "common-table-card blur" : ""}>
        {loading ? (
          <TableSkeleton columns={2} rows={6} />
        ) : (
          <CommonTable columns={columns} data={data} actions={actions} />
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="staff-overlay">
          <div className="staff-form-card">
            <div className="staff-form-header">
              <h3>{editingId ? "Edit Status" : "Create Status"}</h3>

              <span
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="field">
                <label>Status</label>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isActive: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button className="btn-primary full">
                {editingId ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <ConfirmDelete
          title="Delete Status?"
          message="Are you sure you want to delete this status? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}