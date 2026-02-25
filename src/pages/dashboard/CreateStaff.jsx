import { useEffect, useState } from "react";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import { useAuth } from "../../context/AuthContext";
import socket from "../../socket";
import { Pencil, Trash2 } from "lucide-react";
import DeleteConfirmPopup from "../../components/DeleteConfirmPopup";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage"; // ✅ New toast component
import "../../styles/createform.css";

export default function CreateStaff() {
  const { hasPermission, user } = useAuth();

  const canCreate = hasPermission("staff.create");
  const canUpdate = hasPermission("staff.update");
  const canDelete = hasPermission("staff.delete");

  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("success"); // success, warning, error

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    role: "",
  });

  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchStaff();
  }, []);

  useEffect(() => {
    socket.on("staffUpdated", fetchStaff);
    return () => socket.off("staffUpdated");
  }, []);

  const fetchStaff = async (role = "", searchText = "") => {
    try {
      setLoading(true);
      let url = `/auth/staff?`;
      if (role) url += `role=${role}&`;
      if (searchText) url += `search=${searchText}`;

      const [data] = await Promise.all([
        api(url),
        new Promise((res) => setTimeout(res, 400)),
      ]);

      setStaff(data || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await api("/roles");
      setRoles(data || []);
    } catch {
      setRoles([]);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (editingId) {
        await api(`/auth/staff/${editingId}`, {
          method: "PUT",
          body: form,
        });
        setMessage("Staff updated successfully !");
        setMsgType("warning"); // update → yellow
      } else {
        await api("/auth/staff", {
          method: "POST",
          body: form,
        });
        setMessage("Staff created successfully, Email sent!");
        setMsgType("success"); // create → green
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ username: "", email: "", role: "" });

      fetchStaff(selectedRole, search);
    } catch (err) {
      setMessage(err.message || "Error ❌");
      setMsgType("error"); // error → red
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setForm({ username: s.username, email: s.email, role: s.role?._id });
    setEditingId(s._id);
    setShowForm(true);
  };

  const columns = [
    { header: "Username", render: (row) => row.username || "-" },
    { header: "Email", accessor: "email" },
    { header: "Role", render: (row) => row.role?.name || "-" },
  ];

  const actions =
    canUpdate || canDelete
      ? (row) => (
          <>
            {canUpdate && (
              <button className="iconedit" onClick={() => handleEdit(row)}>
                <Pencil size={18} />
              </button>
            )}

            {canDelete &&
              (user?.role === "ADMIN" || row.role?.name !== "ADMIN") && (
                <button
                  className="icondelete"
                  onClick={() => setDeleteId(row._id)}
                >
                  <Trash2 size={18} />
                </button>
              )}
          </>
        )
      : null;

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Staff Management</h2>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Create Staff
          </button>
        )}
      </div>

      {/* ================= TOAST ================= */}
      {message && (
        <ToastMessage
          message={message}
          type={msgType}
          onClose={() => setMessage("")}
        />
      )}

      {/* FILTER */}
      <div className="filter-bar">
        <div className="filter-left">
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchStaff(selectedRole, e.target.value);
            }}
          />
        </div>

        <div className="filter-right-group">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              fetchStaff(e.target.value, search);
            }}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : (
        <CommonTable columns={columns} data={staff} actions={actions} />
      )}

      {/* ================= DELETE ================= */}
      {deleteId && (
        <DeleteConfirmPopup
          staffId={deleteId}
          onClose={() => setDeleteId(null)}
          onSuccess={() => {
            fetchStaff(selectedRole, search);
            setMessage("Staff deleted successfully");
            setMsgType("error"); // delete → red
          }}
        />
      )}

      {/* ================= MODAL ================= */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? "Edit Staff" : "Create Staff"}</h3>
              <span className="modal-close" onClick={() => setShowForm(false)}>
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Username</label>
                <input
                  value={form.username}
                  maxLength={15}
                  minLength={3}
                  pattern="^[a-zA-Z0-9_ ]+$"
                  required
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  maxLength={50}
                  disabled={editingId !== null}
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Role</label>
                <select
                  value={form.role}
                  required
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">Select Role</option>
                  {roles
                    .filter((r) =>
                      user?.role === "ADMIN" ? true : r.name !== "ADMIN"
                    )
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary full"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Staff"
                  : "Create Staff"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}