import { useEffect, useState, useMemo } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDelete from "../../components/ConfirmDelete";
import ToastMessage from "../../components/ToastMessage";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import FormModal from "../../components/FormModal";
import StatusBadge from "../../components/StatusBadge";
import useToast from "../../hooks/useToast";

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // ── Pagination & Limit States ────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem("table_entries");
    return saved ? Number(saved) : 10;
  });

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  const initialForm = { name: "", value: "", isActive: true };
  const [form, setForm] = useState(initialForm);

  // ── Fetch ───────────────────────────────────────────────
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api("/permissions");
      setPermissions(data || []);
    } catch {
      showToast("Failed to load permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-generate value from name ───────────────────────
  const handleNameChange = (e) => {
    const name = e.target.value;
    const value = name.trim().toLowerCase().replace(/\s+/g, ".");
    setForm((prev) => ({ ...prev, name, value }));
  };

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api(`/permissions/${editingId}`, { method: "PUT", body: form });
        showToast(`"${form.name}" permission updated`, "warning");
      } else {
        await api("/permissions", { method: "POST", body: form });
        showToast(`"${form.name}" permission created`, "success");
      }
      closeForm();
      fetchPermissions();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────
  const handleEdit = (row) => {
    setForm({ name: row.name, value: row.value, isActive: row.isActive });
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
      await api(`/permissions/${deleteId}`, { method: "DELETE" });
      showToast(`"${deleteName}" permission deleted`, "error");
      setDeleteId(null);
      fetchPermissions();
    } catch {
      showToast("Failed to delete permission", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  // ── Filtered & Paginated data ────────────────────────────
  const filtered = useMemo(() => {
    return permissions.filter(
      (p) =>
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.value?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [permissions, search]);

  // FIX: Calculate Total Pages for the Next button
  const totalPages = useMemo(() => {
    return Math.ceil(filtered.length / limit) || 1;
  }, [filtered, limit]);

  // FIX: Slice data for current page view
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filtered.slice(startIndex, startIndex + limit);
  }, [filtered, currentPage, limit]);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ── Table config ─────────────────────────────────────────
  const columns = [
    { header: "Permission Name", accessor: "name" },
    { header: "Value", accessor: "value" },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge value={row.isActive ? "active" : "inactive"} />
      ),
    },
  ];

  const actions = (row) => (
    <div style={{ display: "flex", gap: "8px" }}>
      <button className="iconedit" title="Edit" onClick={() => handleEdit(row)}>
        <Pencil size={17} />
      </button>
      <button
        className="icondelete"
        title="Delete"
        onClick={() => handleDeleteClick(row)}
      >
        <Trash2 size={17} />
      </button>
    </div>
  );

  return (
    <div className="permission-page">
      <PageHeader
        title="Permission Management"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Permission
          </button>
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

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permissions..."
      />

      {loading ? (
        <TableSkeleton columns={3} rows={limit} />
      ) : (
        <CommonTable
          columns={columns}
          data={paginatedData} // Sliced data
          totalRecords={filtered.length} // Full filtered count
          totalPages={totalPages} // FIX: Enables Next button
          currentPage={currentPage}
          limit={limit}
          onPageChange={(p) => setCurrentPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setCurrentPage(1);
          }}
          actions={actions}
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Edit Permission" : "Add Permission"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>
              Permission Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={form.name}
              required
              placeholder="e.g. Staff Create"
              onChange={handleNameChange}
            />
          </div>

          <div className="form-field">
            <label>Permission Value</label>
            <input
              value={form.value}
              placeholder="Auto-generated"
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              style={{ background: "#f9fafb", color: "#64748b" }}
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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Create Permission"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDelete
          title={`Delete "${deleteName}"?`}
          message="This permission will be permanently removed. Any roles using it will lose access."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
