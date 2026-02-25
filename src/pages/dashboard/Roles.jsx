import { useEffect, useState } from "react";
import { api } from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import CommonTable from "../../components/CommonTable";
import { Pencil, Trash2 } from "lucide-react";
import TableSkeleton from "../../components/TableSkeleton";
import ConfirmDelete from "../../components/ConfirmDelete";
import ToastMessage from "../../components/ToastMessage";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRoles();
  }, []);

  // ✅ TOAST FROM OTHER PAGES
  useEffect(() => {
    if (location.state?.toast?.id) {
      setToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.toast?.id]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api("/roles");
      setRoles(data);
    } catch (err) {
      setToast({
        id: Date.now(),
        type: "error",
        text: "Failed to load roles",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = (id, name) => {
    if (name === "ADMIN") return alert("Admin role cannot be deleted");
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);

      await api(`/roles/${deleteId}`, { method: "DELETE" });

      // 🔴 Red delete toast
      setToast({
        id: Date.now(),
        type: "error",
        text: "Role deleted successfully",
      });

      setDeleteId(null);
      fetchRoles();
    } catch (err) {
      setToast({
        id: Date.now(),
        type: "error",
        text: "Failed to delete role",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [{ header: "Role Name", accessor: "name" }];

  const actions = (row) => (
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        className="iconedit"
        onClick={() => navigate(`/dashboard/roles/${row._id}`)}
      >
        <Pencil size={18} />
      </button>

      {row.name !== "ADMIN" && (
        <button
          className="icondelete"
          onClick={() => deleteRole(row._id, row.name)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Role Management</h2>
        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/dashboard/roles/create")}
          >
            + Add Role
          </button>
        </div>
      </div>

      {toast && (
        <ToastMessage
          key={toast.id}
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {loading ? (
        <TableSkeleton columns={1} rows={5} />
      ) : (
        <CommonTable columns={columns} data={roles} actions={actions} />
      )}

      {deleteId && (
        <ConfirmDelete
          title={`Delete ${deleteName}?`}
          message="Are you sure?"
          onCancel={() => setDeleteId(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}