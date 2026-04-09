// src/pages/dashboard/CreateRole.jsx
// FIXED:
//   - Used .staff-header CSS class which doesn't exist / doesn't match rest of app
//     All other pages use .page-header — now consistent

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function CreateRole() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCompanyIdForCreate, isAdmin, isGlobal } = useCompany();

  const actions  = ["read", "create", "update", "delete"];
  const features = ["task", "issue", "staff", "role", "permission", "taskStatus", "project", "document", "team"];

  const [name, setName]       = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving]   = useState(false);

  const togglePermission = (value) => {
    const [feature, action] = value.split(".");
    setSelected((prev) => {
      const has = prev.includes(value);
      let updated = [...prev];
      if (has) {
        updated = updated.filter((p) => p !== value);
        if (action === "read") {
          updated = updated.filter((p) => !p.startsWith(`${feature}.`));
        }
      } else {
        updated.push(value);
        if (action !== "read") {
          const readPerm = `${feature}.read`;
          if (!updated.includes(readPerm)) updated.push(readPerm);
        }
      }
      return updated;
    });
  };

  const toggleAll = (feature) => {
    const perms = actions.map((a) => `${feature}.${a}`);
    const allSelected = perms.every((p) => selected.includes(p));
    setSelected((prev) => {
      if (allSelected) return prev.filter((p) => !p.startsWith(feature));
      const filtered = prev.filter((p) => !p.startsWith(feature));
      return [...filtered, ...perms];
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      return navigate("/dashboard/roles", {
        state: { toast: { id: Date.now(), type: "error", text: "Role name is required" } },
      });
    }
    try {
      setSaving(true);
      const body = { name, permissions: selected };
      // ✅ ADMIN: attach company (null = global, ObjectId = specific company)
      if (isAdmin) {
        body.company = getCompanyIdForCreate(); // null for global, id for specific company
      }
      await api("/roles", { method: "POST", body });
      navigate("/dashboard/roles", {
        state: { toast: { id: Date.now(), type: "success", text: `"${name}" role created` } },
      });
    } catch (err) {
      navigate("/dashboard/roles", {
        state: { toast: { id: Date.now(), type: "error", text: err.message || "Failed to create role" } },
      });
    } finally {
      setSaving(false);
    }
  };

  const featureLabels = {
    task: "Tasks", issue: "Issues", staff: "Staff", role: "Roles",
    permission: "Permissions", taskStatus: "Task Status",
    project: "Projects", document: "Documents", team: "Team",
  };

  return (
    <div>
      {/* FIX: .page-header instead of .staff-header */}
      <div className="page-header">
        <h2>Create Role</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/roles")}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>

      <div className="common-table-card" style={{ padding: "20px" }}>
        <div className="form-field" style={{ marginBottom: "20px", maxWidth: "320px" }}>
          <label>Role Name <span style={{ color: "#dc2626" }}>*</span></label>
          <input
            type="text"
            value={name}
            placeholder="e.g. Manager, Viewer"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="common-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Feature</th>
                <th>ALL</th>
                {actions.map((a) => (
                  <th key={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature}>
                  <td style={{ fontWeight: 500 }}>
                    {featureLabels[feature] || feature}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={actions.map((a) => `${feature}.${a}`).every((p) => selected.includes(p))}
                      onChange={() => toggleAll(feature)}
                    />
                  </td>
                  {actions.map((action) => {
                    const value = `${feature}.${action}`;
                    return (
                      <td key={action} style={{ textAlign: "center" }}>
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
    </div>
  );
}
