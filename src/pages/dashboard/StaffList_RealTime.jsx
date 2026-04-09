import { useEffect, useState, useCallback } from "react";
import { api } from "../../api";
import { useCompany } from "../../hooks/useCompany";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage";
import RealTimeProvider from "../../components/RealTimeProvider";
import { Pencil, Trash2, Eye } from "lucide-react";

/**
 * StaffListContent - Main content component
 * Separated to ensure real-time updates propagate correctly
 */
function StaffListContent() {
  const { isGlobal } = useCompany();
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("success");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    isActive: true,
  });

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api("/users");
      setStaff(data || []);
      console.log("👥 Staff fetched:", data?.length || 0);
    } catch (err) {
      console.error("❌ Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const data = await api("/roles");
      setRoles(data || []);
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, [fetchStaff, fetchRoles]);

  // Handle real-time events
  const handleRealTimeEvent = useCallback(
    ({ type }) => {
      console.log(`📡 Real-time event: ${type}`);

      // Trigger refresh on any staff event
      if (["staffCreated", "staffDeleted", "staffRoleUpdated"].includes(type)) {
        setTimeout(() => {
          fetchStaff();
        }, 100);
      }
    },
    [fetchStaff],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (editingId) {
        await api(`/users/${editingId}`, { method: "PUT", body: form });
        setMessage("Staff updated successfully");
        setMsgType("warning");
      } else {
        await api("/auth/register", { method: "POST", body: form });
        setMessage("Staff created successfully");
        setMsgType("success");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        username: "",
        email: "",
        password: "",
        role: "",
        isActive: true,
      });

      // Refresh after a small delay
      setTimeout(() => {
        fetchStaff();
      }, 500);
    } catch (err) {
      setMessage(err.message || "Error ❌");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setForm({
      username: s.username,
      email: s.email,
      password: "",
      role: s.role?._id || "",
      isActive: s.isActive,
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Staff?")) return;
    try {
      setSaving(true);
      await api(`/users/${id}`, { method: "DELETE" });
      setMessage("Staff deleted successfully");
      setMsgType("success");

      // Refresh after deletion
      setTimeout(() => {
        fetchStaff();
      }, 500);
    } catch (err) {
      setMessage(err.message || "Error ❌");
      setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: "Username",
      accessor: "username",
      render: (value) => <strong>{value}</strong>,
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Role",
      accessor: "role",
      render: (role) => (
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            backgroundColor: role?.name === "ADMIN" ? "#e74c3c" : "#3498db",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {role?.name || "User"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (value) => (value ? "✅ Active" : "⛔ Inactive"),
    },
  ];

  const actions = (row) => (
    <>
      <button
        className="iconedit"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
      >
        <Pencil size={18} />
      </button>
      <button
        className="icondelete"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row._id);
        }}
      >
        <Trash2 size={18} />
      </button>
      <button
        className="iconview"
        onClick={(e) => {
          e.stopPropagation();
          setViewStaff(row);
        }}
      >
        <Eye size={18} />
      </button>
    </>
  );

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Staff Management</h2>
        {!isGlobal && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Staff
          </button>
        )}
      </div>

      {message && (
        <ToastMessage
          message={message}
          type={msgType}
          onClose={() => setMessage("")}
        />
      )}

      {loading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : (
        <CommonTable columns={columns} data={staff} actions={actions} />
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? "Edit Staff" : "Add Staff"}</h3>
              <span className="modal-close" onClick={() => setShowForm(false)}>
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Username</label>
                <input
                  value={form.username}
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
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {!editingId && (
                <div className="form-field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    required={!editingId}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="form-field">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
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

      {/* VIEW DETAILS */}
      {viewStaff && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Staff Details</h3>
              <span className="modal-close" onClick={() => setViewStaff(null)}>
                ✕
              </span>
            </div>

            <div className="staff-details">
              <p>
                <strong>Username:</strong> {viewStaff.username}
              </p>
              <p>
                <strong>Email:</strong> {viewStaff.email}
              </p>
              <p>
                <strong>Role:</strong> {viewStaff.role?.name || "User"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {viewStaff.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * StaffList - Wrapper component with RealTimeProvider
 * Handles real-time event subscriptions
 */
export default function StaffList() {
  return (
    <RealTimeProvider
      room="org_default"
      events={["staffCreated", "staffDeleted", "staffRoleUpdated"]}
      onEvent={({ type }) => {
        console.log(`🔔 Staff page event: ${type}`);
      }}
    >
      <StaffListContent />
    </RealTimeProvider>
  );
}
