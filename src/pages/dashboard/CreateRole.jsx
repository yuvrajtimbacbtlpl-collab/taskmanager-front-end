import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function CreateRole() {
  const navigate = useNavigate();

  const actions = ["read", "create", "update", "delete"];
  const features = ["task", "staff", "role", "permission"];

  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);

  // Toggle a single permission
  const togglePermission = (value) => {
    const [feature, action] = value.split(".");

    setSelected((prev) => {
      const hasPermission = prev.includes(value);
      let updated = [...prev];

      if (hasPermission) {
        // Unselect the clicked permission
        updated = updated.filter((p) => p !== value);

        // If unselecting read, remove all other permissions for this feature
        if (action === "read") {
          updated = updated.filter((p) => !p.startsWith(`${feature}.`));
        }
      } else {
        // Add the clicked permission
        updated.push(value);

        // If selecting anything other than read, ensure read is also selected
        if (action !== "read") {
          const readPermission = `${feature}.read`;
          if (!updated.includes(readPermission)) {
            updated.push(readPermission);
          }
        }
      }

      return updated;
    });
  };

  // Toggle all permissions for a feature
  const toggleAll = (feature) => {
    const perms = actions.map((a) => `${feature}.${a}`);
    const allSelected = perms.every((p) => selected.includes(p));

    setSelected((prev) => {
      if (allSelected) {
        // Unselect all
        return prev.filter((p) => !p.startsWith(feature));
      } else {
        // Select all (automatically includes read)
        const filtered = prev.filter((p) => !p.startsWith(feature));
        return [...filtered, ...perms];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        return navigate("/dashboard/roles", {
          state: {
            toast: {
              id: Date.now(),
              type: "error", // ❌ RED error
              text: "Role name required",
            },
          },
        });
      }

      await api("/roles", {
        method: "POST",
        body: { name, permissions: selected },
      });

      // ✅ Green toast
      navigate("/dashboard/roles", {
        state: {
          toast: {
            id: Date.now(),
            type: "success", // 🟢 Green
            text: "Role created successfully",
          },
        },
      });
    } catch (err) {
      navigate("/dashboard/roles", {
        state: {
          toast: {
            id: Date.now(),
            type: "error", // 🔴 Red
            text: "Failed to create role",
          },
        },
      });
    }
  };

  return (
    <div>
      <div className="staff-header">
        <h2>Create Role</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard/roles")}
          >
            Cancel
          </button>

          <button className="btn-primary" onClick={handleSubmit}>
            Save Role
          </button>
        </div>
      </div>

      <div className="common-table-card" style={{ padding: "20px" }}>
        <div className="field">
          <label>Role Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <table className="common-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>ALL</th>
              {actions.map((a) => (
                <th key={a}>{a.toUpperCase()}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {features.map((feature) => (
              <tr key={feature}>
                <td style={{ textTransform: "capitalize" }}>
                  {feature}
                </td>

                <td>
                  <input
                    type="checkbox"
                    checked={actions
                      .map((a) => `${feature}.${a}`)
                      .every((p) => selected.includes(p))}
                    onChange={() => toggleAll(feature)}
                  />
                </td>

                {actions.map((action) => {
                  const value = `${feature}.${action}`;
                  return (
                    <td key={action}>
                      <input
                        type="checkbox"
                        checked={selected.includes(value)}
                        onChange={() => togglePermission(value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}