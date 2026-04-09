// src/components/BulkUpload.jsx
// UPDATED from latest shared code:
//   - onShowToast(message, type) — new format matching useToast hook
//     Old: onShowToast({ type:"toast-success", title, text, icon })
//     New: onShowToast("3 tasks imported.", "success")
//   - All upload logic kept exactly as-is

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { api } from "../api";

export default function BulkUpload({ type, projectId, companyId, onUploadSuccess, onShowToast }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("project", projectId);
    formData.append("type", type || "task");
    if (companyId) formData.append("company", companyId);

    try {
      setUploading(true);

      const response = await api("/tasks/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const count   = response?.count   || 0;
      const skipped = response?.skipped || 0;
      const invalid = response?.invalid || 0;

      // Build a clean summary message
      let msg = `${count} ${type || "task"}${count !== 1 ? "s" : ""} imported.`;
      if (skipped > 0) msg += ` ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped.`;
      if (invalid > 0) msg += ` ${invalid} invalid row${invalid !== 1 ? "s" : ""}.`;

      // FIX: new format (message, type) — matches useToast hook
      if (typeof onShowToast === "function") {
        onShowToast(msg, count > 0 ? "success" : "warning");
      }

      if (onUploadSuccess && count > 0) {
        onUploadSuccess();
      }

    } catch (err) {
      console.error("Bulk Upload Error:", err);
      if (typeof onShowToast === "function") {
        onShowToast(err.message || "Error processing Excel file.", "error");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx, .xls"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="btn-secondary"
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || !projectId}
        title={!projectId ? "Select a project first" : "Bulk upload from Excel"}
      >
        <Upload size={16} />
        {uploading ? "Uploading..." : "Bulk Upload"}
      </button>
    </>
  );
}