import { useEffect, useState, useRef } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import Select from "react-select";
import { MentionsInput, Mention } from "react-mentions";
import { Pencil, Trash2, Eye, FolderKanban, Users, Calendar, Tag } from "lucide-react";
import socketService from "../../services/socketService";
import ToastMessage from "../../components/ToastMessage";
import ConfirmDelete from "../../components/ConfirmDelete";
import PageHeader from "../../components/PageHeader";
import FormModal from "../../components/FormModal";
import StatusBadge from "../../components/StatusBadge";
import FilterBar from "../../components/FilterBar";
import useToast from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { useCompany, GLOBAL_COMPANY } from "../../hooks/useCompany";

export default function Projects() {
  const { hasPermission, user } = useAuth();
  const { getCompanyIdForCreate, getCompanyQueryParam, isAdmin, isGlobal, selectedCompany } = useCompany();

  const canCreate = hasPermission("project.create");
  const canUpdate = hasPermission("project.update");
  const canDelete = hasPermission("project.delete");

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem("table_entries")) || 10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast, showToast, clearToast } = useToast();
  const fetchProjectsRef = useRef(null);

  const [form, setForm] = useState({ name: "", description: "", members: [], type: "Business", isActive: true, dueDate: "" });

  // ── Sockets ─────────────────────────────────────────────
  useEffect(() => {
    socketService.joinOrganization("default");
    return () => socketService.leaveOrganization("default");
  }, []);
  useEffect(() => {
    const u1 = socketService.onProjectCreated(() => fetchProjectsRef.current?.());
    const u2 = socketService.onProjectDeleted(() => fetchProjectsRef.current?.());
    const u3 = socketService.onProjectUpdated(() => fetchProjectsRef.current?.());
    return () => { u1?.(); u2?.(); u3?.(); };
  }, []);
  useEffect(() => { fetchProjectsRef.current = () => fetchProjects(search, selectedType, currentPage, limit); });

  useEffect(() => { fetchProjects(search, selectedType, currentPage, limit); fetchUsers(); }, [currentPage, limit, selectedCompany]);
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchProjects(search, selectedType, 1, limit); }, 400);
    return () => clearTimeout(t);
  }, [search, selectedType]);

  // ── Fetch projects ───────────────────────────────────────
  const fetchProjects = async (searchText = search, type = selectedType, page = currentPage, lim = limit) => {
    try {
      setLoading(true);
      let url = `/projects?page=${page}&limit=${lim}`;
      if (isAdmin && selectedCompany && !isGlobal) url += `&company=${selectedCompany._id}`;
      if (searchText) url += `&search=${searchText}`;
      if (type) url += `&type=${type}`;
      const res = await api(url);
      if (Array.isArray(res)) {
        setProjects(res);
        setTotalRecords(res.length);
        setTotalPages(Math.ceil(res.length / lim) || 1);
      } else if (res?.data) {
        setProjects(res.data);
        setTotalRecords(res.total || 0);
        setTotalPages(res.pages || 1);
      } else { setProjects([]); }
    } catch (err) {
      showToast("Failed to fetch projects", "error");
      setProjects([]);
    } finally { setLoading(false); }
  };

  // ── Fetch users for member select ────────────────────────
  const fetchUsers = async () => {
    try {
      let url = "/auth/staff";
      const qp = getCompanyQueryParam();
      if (qp) url += qp;
      const data = await api(url);
      setUsers(Array.isArray(data) ? data : data?.data || []);
    } catch { setUsers([]); }
  };

  const getStatusValue = (row) => {
    const val = row.isActive ?? row.status;
    return val === true || String(val).toLowerCase() === "active" ? "active" : "inactive";
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Project name is required", "error");
    try {
      setSaving(true);
      const body = {
        name: form.name.trim(),
        description: form.description || "",
        members: form.members.map((m) => m.value),
        type: form.type || "Business",
        isActive: Boolean(form.isActive),
        status: form.isActive ? "Active" : "Inactive",
        dueDate: form.dueDate || undefined,
      };
      if (isAdmin) {
        if (isGlobal) return showToast("Please select a specific company to create a project", "error");
        body.company = getCompanyIdForCreate();
      }
      if (editingId) {
        await api(`/projects/${editingId}`, { method: "PUT", body });
        showToast(`"${form.name}" updated successfully`, "warning");
      } else {
        await api("/projects", { method: "POST", body });
        showToast(`"${form.name}" created successfully`, "success");
      }
      closeForm();
      fetchProjects(search, selectedType, currentPage, limit);
    } catch (err) {
      showToast(err.message || "Operation failed", "error");
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || "",
      members: (p.members || []).map((m) => ({ value: m._id, label: m.username })),
      type: p.type || "Business",
      isActive: getStatusValue(p) === "active",
      dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split("T")[0] : "",
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api(`/projects/${deleteId}`, { method: "DELETE" });
      showToast(`"${deleteName}" deleted`, "success");
      setDeleteId(null);
      fetchProjects(search, selectedType, currentPage, limit);
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
    } finally { setDeleteLoading(false); }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", description: "", members: [], type: "Business", isActive: true, dueDate: "" });
  };

  // ── Type badge colors ────────────────────────────────────
  const typeBadge = (type) => {
    const map = { Business: "#4f46e5:#eef2ff", Development: "#059669:#ecfdf5", Marketing: "#d97706:#fffbeb", Design: "#db2777:#fdf2f8", HR: "#7c3aed:#f5f3ff", Other: "#64748b:#f8fafc" };
    const [c, bg] = (map[type] || map.Other).split(":");
    return <span style={{ background: bg, color: c, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{type}</span>;
  };

  const columns = [
    { header: "Project", render: (row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>{row.name}</div>
        {row.company?.name && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>🏢 {row.company.name}</div>}
      </div>
    )},
    { header: "Type", render: (row) => typeBadge(row.type) },
    { header: "Members", render: (row) => {
      const members = row.members || [];
      if (!members.length) return <span style={{ color: "#94a3b8", fontSize: 12 }}>No members</span>;
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {members.slice(0, 3).map((m) => (
            <span key={m._id} className="avatar-chip">
              <span className="av-circle">{(m.username || "?")[0].toUpperCase()}</span>
              {m.username}
            </span>
          ))}
          {members.length > 3 && <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>+{members.length - 3} more</span>}
        </div>
      );
    }},
    { header: "Status", render: (row) => <StatusBadge value={getStatusValue(row)} /> },
    { header: "Due Date", render: (row) => row.dueDate
      ? <span style={{ fontSize: 12, color: "#475569" }}>📅 {new Date(row.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
    },
  ];

  const actions = (row) => (
    <div className="table-actions">
      {canUpdate && <button className="iconedit" title="Edit" onClick={() => handleEdit(row)}><Pencil size={15} /></button>}
      {canDelete && <button className="icondelete" title="Delete" onClick={() => { setDeleteId(row._id); setDeleteName(row.name); }}><Trash2 size={15} /></button>}
      <button className="iconview" title="View Details" onClick={() => setViewProject(row)}><Eye size={15} /></button>
    </div>
  );

  return (
    <div className="permission-page">
      <PageHeader title="Project Management"
        actions={canCreate && !isGlobal && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <FolderKanban size={15} /> New Project
          </button>
        )}
      />
      {toast && <ToastMessage key={toast.id} {...toast} onClose={clearToast} />}

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search projects..."
        filters={[{
          value: selectedType,
          onChange: (e) => setSelectedType(e.target.value),
          placeholder: "All Types",
          options: ["Business","Development","Marketing","Design","HR","Other"].map(t => ({ value: t, label: t })),
        }]}
      />

      {loading ? <TableSkeleton columns={5} rows={limit} /> : (
        <CommonTable columns={columns} data={projects} actions={actions}
          totalRecords={totalRecords} currentPage={currentPage} totalPages={totalPages}
          limit={limit}
          onPageChange={setCurrentPage}
          onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
        />
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      <FormModal open={showForm} onClose={closeForm} title={editingId ? "Edit Project" : "Create New Project"} size="lg">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div className="form-field" style={{ gridColumn: "1/-1" }}>
              <label>Project Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["Business","Development","Marketing","Design","HR","Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}>
              <label>Due Date <span style={{ fontSize: 11, color: "#94a3b8" }}>(optional)</span></label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}>
              <label>Team Members <span style={{ fontSize: 11, color: "#94a3b8" }}>(optional — leave empty to create project first)</span></label>
              <Select isMulti
                options={users.map((u) => ({ value: u._id, label: u.username }))}
                value={form.members}
                onChange={(s) => setForm({ ...form, members: s || [] })}
                placeholder="Select team members..."
                noOptionsMessage={() => "No staff found"}
                styles={{ control: (b) => ({ ...b, borderRadius: 8, borderColor: "#e2e8f0", minHeight: 42 }) }}
              />
            </div>
            <div className="form-field" style={{ gridColumn: "1/-1" }}>
              <label>Description</label>
              <MentionsInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ minHeight: 80 }}>
                <Mention trigger="@" data={users.map((u) => ({ id: u._id, display: u.username }))} appendSpaceOnAdd />
              </MentionsInput>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : editingId ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* ── VIEW MODAL ── */}
      <FormModal open={!!viewProject} onClose={() => setViewProject(null)} title="Project Details" size="lg">
        {viewProject && (
          <>
            <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderKanban size={24} color="#4f46e5" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>{viewProject.name}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {typeBadge(viewProject.type)}
                  <StatusBadge value={getStatusValue(viewProject)} />
                </div>
              </div>
            </div>
            <div className="view-detail-grid">
              <div className="view-detail-item">
                <div className="vdi-label">Company</div>
                <div className="vdi-value">🏢 {viewProject.company?.name || "—"}</div>
              </div>
              <div className="view-detail-item">
                <div className="vdi-label">Created By</div>
                <div className="vdi-value">👤 {viewProject.createdBy?.username || "—"}</div>
              </div>
              <div className="view-detail-item">
                <div className="vdi-label">Created At</div>
                <div className="vdi-value">📅 {viewProject.createdAt ? new Date(viewProject.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
              </div>
              <div className="view-detail-item">
                <div className="vdi-label">Due Date</div>
                <div className="vdi-value">{viewProject.dueDate ? `⏰ ${new Date(viewProject.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : "No deadline"}</div>
              </div>
              {viewProject.description && (
                <div className="view-detail-item full-width">
                  <div className="vdi-label">Description</div>
                  <div className="vdi-value" style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>{viewProject.description}</div>
                </div>
              )}
              <div className="view-detail-item full-width">
                <div className="vdi-label">Team Members ({(viewProject.members || []).length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {(viewProject.members || []).length === 0
                    ? <span style={{ color: "#94a3b8", fontSize: 13 }}>No members assigned</span>
                    : (viewProject.members || []).map((m) => (
                      <span key={m._id} className="avatar-chip">
                        <span className="av-circle">{(m.username || "?")[0].toUpperCase()}</span>
                        {m.username}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <div className="form-actions">
              {canUpdate && (
                <button className="btn-primary" onClick={() => { setViewProject(null); handleEdit(viewProject); }}>
                  <Pencil size={14} /> Edit Project
                </button>
              )}
            </div>
          </>
        )}
      </FormModal>

      {/* ── DELETE CONFIRM ── */}
      {deleteId && (
        <ConfirmDelete
          title={`Delete "${deleteName}"?`}
          message="All tasks and team assignments in this project will be lost. This cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
