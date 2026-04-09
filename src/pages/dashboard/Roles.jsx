import { useEffect, useState, useMemo } from "react";
import { api } from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import CommonTable from "../../components/CommonTable";
import { Pencil, Trash2, Shield, Eye } from "lucide-react";
import TableSkeleton from "../../components/TableSkeleton";
import ConfirmDelete from "../../components/ConfirmDelete";
import FormModal from "../../components/FormModal";
import ToastMessage from "../../components/ToastMessage";
import PageHeader from "../../components/PageHeader";
import useToast from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";

export default function Roles() {
  const { user } = useAuth();
  const { getCompanyQueryParam, isAdmin, selectedCompany } = useCompany();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem("table_entries")) || 10);
  const totalPages = useMemo(() => Math.ceil(roles.length / limit) || 1, [roles, limit]);
  const paginatedRoles = useMemo(() => roles.slice((currentPage - 1) * limit, currentPage * limit), [roles, currentPage, limit]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { if (isAdmin) fetchRoles(); }, [selectedCompany]);
  useEffect(() => {
    if (location.state?.toast?.id) {
      showToast(location.state.toast.text, location.state.toast.type);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const url = `/roles${getCompanyQueryParam()}`;
      const data = await api(url);
      setRoles(data || []);
    } catch { showToast("Failed to load roles", "error"); }
    finally { setLoading(false); }
  };

  const permCount = (role) => (role.permissions || []).length;

  const scopeBadge = (role) => {
    if (!role.company) return <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🌐 Global</span>;
    return <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🏢 {role.company?.name || "Company"}</span>;
  };

  const columns = [
    { header: "Role Name", render: (row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={16} color="#4f46e5" />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>{row.name}</div>
        </div>
      </div>
    )},
    { header: "Scope", render: (row) => scopeBadge(row) },
    { header: "Permissions", render: (row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {permCount(row)} permissions
        </span>
      </div>
    )},
    { header: "Created", render: (row) => <span style={{ fontSize: 12, color: "#64748b" }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span> },
  ];

  const actions = (row) => (
    <div className="table-actions">
      <button className="iconview" title="View Permissions" onClick={() => setViewRole(row)}><Eye size={15} /></button>
      <button className="iconedit" title="Edit Permissions" onClick={() => navigate(`/dashboard/roles/${row._id}`)}><Pencil size={15} /></button>
      {row.name !== "ADMIN" && (
        <button className="icondelete" title="Delete" onClick={() => { setDeleteId(row._id); setDeleteName(row.name); }}><Trash2 size={15} /></button>
      )}
    </div>
  );

  const FEATURES = ["task","issue","staff","role","permission","taskStatus","project","document","team"];
  const ACTIONS = ["read","create","update","delete"];

  return (
    <div className="permission-page">
      <PageHeader title="Role Management"
        actions={<button className="btn-primary" onClick={() => navigate("/dashboard/roles/create")}><Shield size={15} /> Create Role</button>}
      />
      {toast && <ToastMessage key={toast.id} {...toast} onClose={clearToast} />}

      {loading ? <TableSkeleton columns={4} rows={limit} /> : (
        <CommonTable columns={columns} data={paginatedRoles} actions={actions}
          totalRecords={roles.length} totalPages={totalPages} currentPage={currentPage} limit={limit}
          onPageChange={setCurrentPage} onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
        />
      )}

      {/* VIEW ROLE PERMISSIONS */}
      <FormModal open={!!viewRole} onClose={() => setViewRole(null)} title={`Permissions — ${viewRole?.name || ""}`} size="lg">
        {viewRole && (
          <>
            <div style={{ padding: "16px 24px 0", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={20} color="#4f46e5" /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{viewRole.name}</div>
                <div style={{ marginTop: 4 }}>{scopeBadge(viewRole)}</div>
              </div>
              <div style={{ marginLeft: "auto", background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {permCount(viewRole)} / {FEATURES.length * ACTIONS.length} permissions
              </div>
            </div>
            <div style={{ padding: "16px 24px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Feature</th>
                    {ACTIONS.map(a => <th key={a} style={{ padding: "8px 12px", textAlign: "center", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>{a}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(feature => (
                    <tr key={feature} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>{feature}</td>
                      {ACTIONS.map(action => {
                        const has = (viewRole.permissions || []).includes(`${feature}.${action}`);
                        return (
                          <td key={action} style={{ padding: "8px 12px", textAlign: "center" }}>
                            {has ? <span style={{ color: "#15803d", fontSize: 16 }}>✓</span> : <span style={{ color: "#e2e8f0", fontSize: 16 }}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => { setViewRole(null); navigate(`/dashboard/roles/${viewRole._id}`); }}><Pencil size={14} /> Edit Permissions</button>
            </div>
          </>
        )}
      </FormModal>

      {deleteId && (
        <ConfirmDelete
          title={`Delete role "${deleteName}"?`}
          message="Staff assigned this role will lose all associated permissions."
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            try {
              setDeleteLoading(true);
              await api(`/roles/${deleteId}`, { method: "DELETE" });
              showToast(`"${deleteName}" deleted`, "delete");
              setDeleteId(null);
              fetchRoles();
            } catch { showToast("Failed to delete", "error"); }
            finally { setDeleteLoading(false); }
          }}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
