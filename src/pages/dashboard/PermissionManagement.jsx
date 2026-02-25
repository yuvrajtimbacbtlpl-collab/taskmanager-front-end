import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDelete from "../../components/ConfirmDelete";
import ToastMessage from "../../components/ToastMessage";

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ TOAST STATE (fixed with id)
  const [toast, setToast] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const initialForm = {
    name: "",
    value: "",
    isActive: true,
  };

  const [form, setForm] = useState(initialForm);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api("/permissions");
      setPermissions(data || []);
    } catch (err) {
      showToast("Failed to load permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOAST HELPER ================= */

  const showToast = (message, type = "success") => {
    setToast({
      id: Date.now(), // ✅ forces re-render every time
      message,
      type,
    });
  };

  /* ================= AUTO VALUE ================= */

  const handleNameChange = (e) => {
    const name = e.target.value;
    const value = name.trim().toLowerCase().replace(/\s+/g, ".");

    setForm((prev) => ({
      ...prev,
      name,
      value,
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api(`/permissions/${editingId}`, {
          method: "PUT",
          body: form,
        });

        showToast("Permission updated successfully", "warning");

      } else {
        await api("/permissions", {
          method: "POST",
          body: form,
        });

        showToast("Permission created successfully", "success");
      }

      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);

      await fetchPermissions();

    } catch (err) {
      showToast("Something went wrong", "error");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      await api(`/permissions/${deleteId}`, {
        method: "DELETE",
      });

      setDeleteId(null);

      showToast("Permission deleted successfully", "error");

      await fetchPermissions();

    } catch (err) {
      showToast("Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ================= TABLE ================= */

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Value", accessor: "value" },
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

  const actions = (row) => (
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        className="iconedit"
        onClick={() => {
          setForm({
            name: row.name,
            value: row.value,
            isActive: row.isActive,
          });
          setEditingId(row._id);
          setShowForm(true);
        }}
        title="Edit"
      >
        <Pencil size={18} />
      </button>

      <button
        className="icondelete"
        onClick={() => handleDelete(row._id)}
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );

  /* ================= UI ================= */

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Permission Management</h2>

        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(initialForm);
            }}
          >
            + Create Permission
          </button>
        </div>
      </div>

      <div className={showForm ? "common-table-card blur" : ""}>
        {loading ? (
          <TableSkeleton columns={3} rows={6} />
        ) : (
          <CommonTable
            columns={columns}
            data={permissions}
            actions={actions}
          />
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="staff-overlay">
          <div className="staff-form-card">
            <div className="staff-form-header">
              <h3>
                {editingId
                  ? "Edit Permission"
                  : "Create Permission"}
              </h3>

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
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div className="field">
                <label>Value (Auto)</label>
                <input value={form.value} readOnly />
              </div>

              <div className="field">
                <label>Status</label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive:
                        e.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <button className="btn-primary full">
                {editingId ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE POPUP */}
      {deleteId && (
        <ConfirmDelete
          title="Delete Permission?"
          message="Are you sure you want to delete this permission? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
        />
      )}

      {/* ✅ TOAST */}
      {toast && (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}