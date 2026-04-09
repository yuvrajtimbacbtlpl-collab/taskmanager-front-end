import { useEffect, useState, useMemo } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import { Pencil, Trash2 } from "lucide-react";
import ToastMessage from "../../components/ToastMessage";
import ConfirmDelete from "../../components/ConfirmDelete";
import PageHeader from "../../components/PageHeader";
import FormModal from "../../components/FormModal";
import StatusBadge from "../../components/StatusBadge";
import useToast from "../../hooks/useToast";

export default function TaskStatus() {
  const { hasPermission, user } = useAuth();
  const { getCompanyIdForCreate, getCompanyQueryParam, isAdmin, selectedCompany } = useCompany();

  const canCreate = hasPermission("taskStatus.create");
  const canUpdate = hasPermission("taskStatus.update");
  const canDelete = hasPermission("taskStatus.delete");
  const canRead = hasPermission("taskStatus.read");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", isActive: true });

  // ── Pagination & Limit States ────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem("table_entries");
    return saved ? Number(saved) : 10;
  });

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  // ── Pagination Logic ────────────────────────────────────
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / limit) || 1;
  }, [data, limit]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return data.slice(startIndex, startIndex + limit);
  }, [data, currentPage, limit]);

  // ── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const url = `/task-status${getCompanyQueryParam()}`;
      const res = await api(url);
      setData(res || []);
    } catch {
      showToast("Failed to load task statuses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) fetchData();
  }, [canRead]);

  // ✅ Re-fetch when admin switches company
  useEffect(() => {
    if (isAdmin && canRead) fetchData();
  }, [selectedCompany]);

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const submitBody = { ...form };
      // ✅ ADMIN: attach company (null = global, ObjectId = specific company)
      if (isAdmin && !editingId) {
        submitBody.company = getCompanyIdForCreate(); // null for global, id for specific company
      }

      if (editingId) {
        await api(`/task-status/${editingId}`, { method: "PUT", body: submitBody });
        showToast(`"${form.name}" status updated`, "warning");
      } else {
        await api("/task-status", { method: "POST", body: submitBody });
        showToast(`"${form.name}" status created`, "success");
      }
      closeForm();
      fetchData();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────
  const handleEdit = (row) => {
    setForm({ name: row.name, isActive: row.isActive });
    setEditingId(row._id);
    setShowForm(true);
  };

  // ── Delete ──────────────────────────────────────────────
  const handleDeleteClick = (row) => {
    setDeleteId(row._id);
    setDeleteName(row.name);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api(`/task-status/${deleteId}`, { method: "DELETE" });
      showToast(`"${deleteName}" status deleted`, "delete");
      setDeleteId(null);
      fetchData();
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", isActive: true });
  };

  // ── Table config ─────────────────────────────────────────
  const columns = [
    { header: "Status Name", accessor: "name" },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge value={row.isActive ? "active" : "inactive"} />
      ),
    },
  ];

  const actions = (row) => (
    <div style={{ display: "flex", gap: "8px" }}>
      {canUpdate && (
        <button
          className="iconedit"
          title="Edit"
          onClick={() => handleEdit(row)}
        >
          <Pencil size={17} />
        </button>
      )}
      {canDelete && (
        <button
          className="icondelete"
          title="Delete"
          onClick={() => handleDeleteClick(row)}
        >
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );

  return (
    <div className="permission-page">
      <PageHeader
        title="Task Status"
        actions={
          canCreate && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Add Status
            </button>
          )
        }
      />

      {toast && (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

      {loading ? (
        <TableSkeleton columns={2} rows={limit} />
      ) : (
        <CommonTable
          columns={columns}
          data={paginatedData}
          totalRecords={data.length}
          totalPages={totalPages}
          currentPage={currentPage}
          limit={limit}
          onPageChange={(p) => setCurrentPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setCurrentPage(1);
          }}
          actions={canUpdate || canDelete ? actions : null}
        />
      )}

      <FormModal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Edit Task Status" : "Create Task Status"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>
              Status Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={form.name}
              required
              placeholder="e.g. In Progress"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Active</label>
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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Status"
                  : "Create Status"}
            </button>
          </div>
        </form>
      </FormModal>

      {deleteId && (
        <ConfirmDelete
          title={`Delete "${deleteName}"?`}
          message="This status will be permanently removed and cannot be recovered."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
