import { useEffect, useState } from "react";
import { api } from "../../api";
import { hasPermission } from "../../utils/hasPermission";
import { useOutletContext } from "react-router-dom";

export default function StaffList() {
  const { role, permissions } = useOutletContext();
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const data = await api("/staff");
    setStaff(data);
  };

  const handleDelete = async (id) => {
    await api(`/staff/${id}`, { method: "DELETE" });
    fetchStaff();
  };

  return (
    <div className="page">
      <h2>Staff List</h2>

      {staff.map((user) => (
        <div key={user._id} className="staff-row">
          <div>
            <strong>{user.username}</strong>
            <p>{user.email}</p>
          </div>

          <div className="actions">
            {/* 🔥 ADMIN ALWAYS ALLOWED */}
            {hasPermission(permissions, "staff.update", role) && (
              <button>Edit</button>
            )}

            {hasPermission(permissions, "staff.delete", role) && (
              <button onClick={() => handleDelete(user._id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
