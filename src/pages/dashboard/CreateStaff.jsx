import { useEffect, useState, useRef } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import socketService from "../../services/socketService";
import { Pencil, Trash2, Eye, UserPlus, Mail, Shield } from "lucide-react";
import DeleteConfirmPopup from "../../components/DeleteConfirmPopup";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import FormModal from "../../components/FormModal";
import useToast from "../../hooks/useToast";
import "../../styles/createform.css";

export default function CreateStaff() {
  const { hasPermission, user } = useAuth();
  const { getCompanyIdForCreate, getCompanyQueryParam, isAdmin, isGlobal, selectedCompany } = useCompany();

  const canCreate = hasPermission("staff.create");
  const canUpdate = hasPermission("staff.update");
  const canDelete = hasPermission("staff.delete");

  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem("table_entries")) || 10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const { toast, showToast, clearToast } = useToast();
  const [form, setForm] = useState({ username: "", email: "", roleId: "" });
  const fetchStaffRef = useRef(null);

  useEffect(() => { socketService.joinOrganization("default"); return () => socketService.leaveOrganization("default"); }, []);
  useEffect(() => {
    const u1 = socketService.onStaffCreated(() => fetchStaffRef.current?.());
    const u2 = socketService.onStaffDeleted(() => fetchStaffRef.current?.());
    const u3 = socketService.onStaffRoleUpdated(() => fetchStaffRef.current?.());
    return () => { u1?.(); u2?.(); u3?.(); };
  }, []);
  useEffect(() => { fetchStaffRef.current = () => fetchStaff(selectedRole, search, currentPage, limit); });

  useEffect(() => { fetchRoles(); fetchStaff(selectedRole, search, currentPage, limit); }, [currentPage, limit]);
  useEffect(() => { if (isAdmin) { setCurrentPage(1); fetchStaff(selectedRole, search, 1, limit); } }, [selectedCompany]);

  const fetchStaff = async (role = selectedRole, searchText = search, page = currentPage, lim = limit) => {
    try {
      setLoading(true);
      let url = `/auth/staff?page=${page}&limit=${lim}&`;
      if (isAdmin) {
        const qp = getCompanyQueryParam("?");
        if (qp) url += qp.replace("?", "") + "&";
      }
      if (role) url += `role=${role}&`;
      if (searchText) url += `search=${searchText}`;
      const data = await api(url);
      if (data?.data) { setStaff(data.data); setTotalRecords(data.total || 0); setTotalPages(data.pages || 1); }
      else {
        const raw = data || [];
        setStaff(raw.slice((page - 1) * lim, page * lim));
        setTotalRecords(raw.length);
        setTotalPages(Math.ceil(raw.length / lim) || 1);
      }
    } catch { setStaff([]); } finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try { const data = await api("/roles"); setRoles(data || []); } catch { setRoles([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const submitBody = { ...form };
      if (isAdmin && !editingId) {
        if (isGlobal) { showToast("Please select a specific company to create staff", "error"); setSaving(false); return; }
        submitBody.company = getCompanyIdForCreate();
      }
      if (editingId) {
        await api(`/auth/staff/${editingId}`, { method: "PUT", body: submitBody });
        showToast(`"${form.username}" updated successfully`, "warning");
      } else {
        await api("/auth/staff", { method: "POST", body: submitBody });
        showToast(`Staff "${form.username}" created. Login details sent by email!`, "success");
      }
      closeForm(); fetchStaff(selectedRole, search, currentPage, limit);
    } catch (err) { showToast(err.message || "Something went wrong", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = (s) => { setForm({ username: s.username, email: s.email, roleId: s.role?._id || "" }); setEditingId(s._id); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ username: "", email: "", roleId: "" }); };

  const roleBadge = (roleName) => {
    const map = { ADMIN: "#dc2626:#fee2e2", COMPANY_OWNER: "#7c3aed:#f5f3ff", STAFF: "#2563eb:#dbeafe" };
    const key = (roleName || "").toUpperCase();
    const [c, bg] = (map[key] || "#475569:#f1f5f9").split(":");
    return <span style={{ background: bg, color: c, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{roleName || "—"}</span>;
  };

  const columns = [
    { header: "Staff Member", render: (row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4f46e5", fontSize: 14, flexShrink: 0 }}>
          {(row.username || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>{row.username}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.email}</div>
        </div>
      </div>
    )},
    { header: "Role", render: (row) => roleBadge(row.role?.name) },
    { header: "Company", render: (row) => row.company?.name
      ? <span style={{ fontSize: 12, color: "#475569" }}>🏢 {row.company.name}</span>
      : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
    },
    { header: "Status", render: (row) => (
      <span style={{ background: row.isActive !== false ? "#dcfce7" : "#fee2e2", color: row.isActive !== false ? "#15803d" : "#b91c1c", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
        {row.isActive !== false ? "Active" : "Inactive"}
      </span>
    )},
    { header: "Joined", render: (row) => <span style={{ fontSize: 12, color: "#64748b" }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span> },
  ];

  const actions = (row) => (
    <div className="table-actions">
      <button className="iconview" title="View" onClick={() => setViewStaff(row)}><Eye size={15} /></button>
      {canUpdate && <button className="iconedit" title="Edit" onClick={() => handleEdit(row)}><Pencil size={15} /></button>}
      {canDelete && user?.role !== row.role?.name && (
        <button className="icondelete" title="Delete" onClick={() => setDeleteId(row._id)}><Trash2 size={15} /></button>
      )}
    </div>
  );

  return (
    <div className="permission-page">
      <PageHeader title="Staff Management"
        actions={canCreate && !isGlobal && (
          <button className="btn-primary" onClick={() => setShowForm(true)}><UserPlus size={15} /> Add Staff</button>
        )}
      />
      {toast && <ToastMessage key={toast.id} {...toast} onClose={clearToast} />}
      <FilterBar searchValue={search} onSearchChange={(v) => { setSearch(v); setCurrentPage(1); fetchStaff(selectedRole, v, 1, limit); }}
        searchPlaceholder="Search by name or email..."
        filters={[{ value: selectedRole, onChange: (e) => { setSelectedRole(e.target.value); setCurrentPage(1); fetchStaff(e.target.value, search, 1, limit); }, placeholder: "All Roles", options: roles.map(r => ({ value: r._id, label: r.name })) }]}
      />

      {loading ? <TableSkeleton columns={5} rows={limit} /> : (
        <CommonTable columns={columns} data={staff} actions={actions}
          totalRecords={totalRecords} currentPage={currentPage} totalPages={totalPages} limit={limit}
          onPageChange={setCurrentPage} onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
        />
      )}

      {/* CREATE / EDIT */}
      <FormModal open={showForm} onClose={closeForm} title={editingId ? "Edit Staff Member" : "Add New Staff"}>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.username} required onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. John Doe" />
          </div>
          <div className="form-field">
            <label>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. john@company.com" disabled={!!editingId} />
            {!editingId && <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Login credentials will be sent to this email automatically.</p>}
          </div>
          <div className="form-field">
            <label>Role</label>
            <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">Select role...</option>
              {roles.filter(r => r.name !== "ADMIN").map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : editingId ? "Update Staff" : "Create & Send Email"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* VIEW */}
      <FormModal open={!!viewStaff} onClose={() => setViewStaff(null)} title="Staff Details">
        {viewStaff && (
          <>
            <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, fontWeight: 700, color: "#4f46e5" }}>
                {(viewStaff.username || "?")[0].toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>{viewStaff.username}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{viewStaff.email}</div>
              <div style={{ marginTop: 8 }}>{roleBadge(viewStaff.role?.name)}</div>
            </div>
            <div className="view-detail-grid" style={{ marginTop: 8 }}>
              <div className="view-detail-item"><div className="vdi-label">Company</div><div className="vdi-value">🏢 {viewStaff.company?.name || "—"}</div></div>
              <div className="view-detail-item"><div className="vdi-label">Status</div><div className="vdi-value">{viewStaff.isActive !== false ? "✅ Active" : "❌ Inactive"}</div></div>
              <div className="view-detail-item full-width"><div className="vdi-label">Member Since</div><div className="vdi-value">📅 {viewStaff.createdAt ? new Date(viewStaff.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</div></div>
            </div>
            <div className="form-actions">
              {canUpdate && <button className="btn-primary" onClick={() => { setViewStaff(null); handleEdit(viewStaff); }}><Pencil size={14} /> Edit</button>}
            </div>
          </>
        )}
      </FormModal>

      {deleteId && (
        <DeleteConfirmPopup
          onConfirm={async () => { await api(`/auth/staff/${deleteId}`, { method: "DELETE" }); setDeleteId(null); showToast("Staff deleted", "delete"); fetchStaff(selectedRole, search, currentPage, limit); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
