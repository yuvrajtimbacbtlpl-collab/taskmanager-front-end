// src/components/CommonTable.jsx — Industry-grade reusable data table
import { useState } from "react";
import "../styles/CommonTable.css";

export default function CommonTable({
  columns,
  data = [],
  totalRecords = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  entriesOptions = [5, 10, 20, 50, 100],
  showEntries = true,
  actions,
  loading = false,
  limit = 10,
  emptyText = "No records found.",
  emptyIcon = "📭",
}) {
  const handleLimitChange = (e) => {
    const val = Number(e.target.value);
    localStorage.setItem("table_entries", val);
    onLimitChange?.(val);
  };

  const safeLimit = limit || 10;
  const rowStart  = data.length === 0 ? 0 : (currentPage - 1) * safeLimit + 1;
  const rowEnd    = data.length === 0 ? 0 : rowStart + data.length - 1;

  return (
    <div className="common-table-card">

      {/* ── Entries selector ── */}
      {showEntries && (
        <div className="table-controls-bar">
          <div className="entries-label">
            Show{" "}
            <select
              className="entries-select"
              value={safeLimit}
              onChange={handleLimitChange}
            >
              {entriesOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {" "}entries
          </div>

          <div style={{ fontSize: 12.5, color: "#94a3b8" }}>
            {totalRecords.toLocaleString()} total records
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="table-wrapper">
        <table className="common-table">
          <thead>
            <tr>
              <th className="center">#</th>
              {columns.map((col, i) => (
                <th key={i} className={col.align || "left"}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="center">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton rows
              [...Array(safeLimit > 10 ? 10 : safeLimit)].map((_, i) => (
                <tr key={`sk-${i}`} className="skeleton-row">
                  <td className="center">
                    <div className="skeleton-box" style={{ width: 28 }} />
                  </td>
                  {columns.map((_, ci) => (
                    <td key={ci}><div className="skeleton-box" /></td>
                  ))}
                  {actions && (
                    <td className="center">
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <div className="skeleton-box" style={{ width: 34, height: 34, borderRadius: 8 }} />
                        <div className="skeleton-box" style={{ width: 34, height: 34, borderRadius: 8 }} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 2 : 1)}
                  style={{ textAlign: "center", padding: "52px 20px" }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{emptyIcon}</div>
                  <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>{emptyText}</div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row._id || i}>
                  <td className="center" style={{ color: "#94a3b8", fontWeight: 600 }}>
                    {(currentPage - 1) * safeLimit + i + 1}
                  </td>
                  {columns.map((col, ci) => (
                    <td key={ci} className={col.align || "left"}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="center">
                      <div className="table-actions">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="table-footer">
        <div className="footer-info">
          {data.length === 0
            ? "No entries to show"
            : <>Showing <strong>{rowStart}</strong>–<strong>{rowEnd}</strong> of <strong>{totalRecords?.toLocaleString() || 0}</strong> entries</>
          }
        </div>

        <div className="pagination">
          <button
            className="pag-btn"
            disabled={currentPage <= 1 || loading}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            ‹ Prev
          </button>
          <span className="page-indicator">
            <strong>{currentPage}</strong> / {totalPages || 1}
          </span>
          <button
            className="pag-btn"
            disabled={currentPage >= (totalPages || 1) || loading}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
