import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import CommonTable from "../../components/CommonTable";
import Loader from "../../components/Loader";

export default function ManageRolePermissions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const actions = ["read", "create", "update", "delete"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const roleData = await api(`/roles/${id}`);
        const allPermissions = await api(`/permissions`);

        setFeatures(allPermissions);
        setRole(roleData);
        setSelected(roleData.permissions || []);
      } catch (err) {
        navigate("/dashboard/roles");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const togglePermission = (feature, action) => {
    const permissionValue = `${feature}.${action}`;

    setSelected((prev) => {
      let updated = [...prev];
      const hasPermission = updated.includes(permissionValue);

      if (hasPermission) {
        updated = updated.filter((p) => p !== permissionValue);

        if (action === "read") {
          updated = updated.filter((p) => !p.startsWith(`${feature}.`));
        }
        return updated;
      } else {
        updated.push(permissionValue);

        if (action !== "read") {
          const readPermission = `${feature}.read`;
          if (!updated.includes(readPermission)) {
            updated.push(readPermission);
          }
        }
        return updated;
      }
    });
  };

  const toggleAllPermissions = (feature) => {
    const featurePermissions = actions.map((a) => `${feature}.${a}`);

    setSelected((prev) => {
      const hasAll = featurePermissions.every((p) => prev.includes(p));

      if (hasAll) {
        return prev.filter((p) => !p.startsWith(`${feature}.`));
      } else {
        const updated = [...prev];

        featurePermissions.forEach((perm) => {
          if (!updated.includes(perm)) updated.push(perm);
        });

        return updated;
      }
    });
  };

  const columns = [
    {
      header: "Permission",
      render: (row) => row.name,
    },
    {
      header: "ALL",
      render: (row) => {
        const perms = actions.map((a) => `${row.value}.${a}`);
        const isAllChecked = perms.every((p) => selected.includes(p));

        return (
          <input
            type="checkbox"
            checked={isAllChecked}
            onChange={() => toggleAllPermissions(row.value)}
          />
        );
      },
    },
    ...actions.map((action) => ({
      header: action.toUpperCase(),
      render: (row) => {
        const value = `${row.value}.${action}`;

        return (
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => togglePermission(row.value, action)}
          />
        );
      },
    })),
  ];

  const handleSave = async () => {
    try {
      await api(`/roles/${id}/permissions`, {
        method: "PUT",
        body: { permissions: selected },
      });

      // 🟡 Warning toast for update
      navigate("/dashboard/roles", {
        state: {
          toast: {
            id: Date.now(),
            type: "warning",
            text: "Permissions updated successfully",
          },
        },
      });
    } catch (err) {
      navigate("/dashboard/roles", {
        state: {
          toast: {
            id: Date.now(),
            type: "error",
            text: "Failed to update permissions",
          },
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="page-loader-center">
        <Loader text="Loading permissions..." />
      </div>
    );
  }

  return (
    <div>
      <h2>
        Role Management <span style={{ color: "#4f46e5" }}>{role?.name}</span>
      </h2>

      <CommonTable columns={columns} data={features} showEntries={false} />

      <div className="form-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard/roles")}
        >
          Cancel
        </button>

        <button className="btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
