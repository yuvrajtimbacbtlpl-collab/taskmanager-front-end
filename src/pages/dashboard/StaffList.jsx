import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import { api } from "../../api";
import { hasPermission } from "../../utils/hasPermission";
import { useOutletContext } from "react-router-dom";
import socketService from "../../services/socketService";

export default function StaffList() {
  const { role, permissions } = useOutletContext();
  const { user } = useAuth();
  const { getCompanyQueryParam, isAdmin, selectedCompany } = useCompany();
  const [staff, setStaff] = useState([]);
  const fetchStaffRef = useRef(null);

  // Join organization room for real-time updates
  useEffect(() => {
    socketService.joinOrganization("default");
    return () => {
      socketService.leaveOrganization("default");
    };
  }, []);

  // Listen for real-time staff updates
  useEffect(() => {
    const unsub1 = socketService.onStaffCreated(() => {
      console.log("✅ New staff created - refreshing list");
      if (fetchStaffRef.current) fetchStaffRef.current();
    });

    const unsub2 = socketService.onStaffDeleted(() => {
      console.log("✅ Staff deleted - refreshing list");
      if (fetchStaffRef.current) fetchStaffRef.current();
    });

    const unsub3 = socketService.onStaffRoleUpdated(() => {
      console.log("✅ Staff role updated - refreshing list");
      if (fetchStaffRef.current) fetchStaffRef.current();
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, []);

  // Store fetch function reference for socket listeners
  useEffect(() => {
    fetchStaffRef.current = fetchStaff;
  }, []);

  useEffect(() => {
    fetchStaff();
  }, []);

  // ✅ Re-fetch when admin switches company
  useEffect(() => {
    if (isAdmin) fetchStaff();
  }, [selectedCompany]);

  const fetchStaff = async () => {
    try {
      const url = isAdmin ? `/staff${getCompanyQueryParam()}` : "/staff";
      const data = await api(url);
      setStaff(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setStaff([]);
    }
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
