import { useState, useEffect } from "react";
import "/src/styles/CommonTable.css";

export default function CommonTable({
  columns,
  data = [],
  entriesOptions = [5, 10, 20],
  showEntries = true,
  actions,
  loading = false,
}) {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("table_entries");
    return saved ? Number(saved) : entriesOptions[0];
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    localStorage.setItem("table_entries", entries);
    setPage(1);
  }, [entries]);

  useEffect(() => {
    setPage(1);
  }, [data]);

  const total = data.length;
  const totalPages = Math.ceil(total / entries) || 1;

  const start = (page - 1) * entries;
  const end = start + entries;

  const paginated = data.slice(start, end);

  return (
    <div className="common-table-card">
      {showEntries && (
        <div className="table-controls">
          <div>
            Show{" "}
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
            >
              {entriesOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>{" "}
            entries
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="common-table">
          {/* Column Width Control */}
          <colgroup>
            <col style={{ width: "60px" }} />
            {columns.map((col, idx) => (
              <col key={idx} style={{ width: col.width || "auto" }} />
            ))}
            {actions && <col style={{ width: "120px" }} />}
          </colgroup>

          <thead>
            <tr>
              <th className="center">#</th>

              {columns.map((col) => (
                <th key={col.header} className={col.align || "left"}>
                  {col.header}
                </th>
              ))}

              {actions && <th className="center">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(entries)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td>
                    <div className="skeleton skeleton-text sm"></div>
                  </td>

                  {columns.map((col, idx) => (
                    <td key={idx}>
                      <div className="skeleton skeleton-text"></div>
                    </td>
                  ))}

                  {actions && (
                    <td>
                      <div className="skeleton-actions">
                        <div className="skeleton skeleton-btn"></div>
                        <div className="skeleton skeleton-btn"></div>
                        <div className="skeleton skeleton-btn"></div>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="center">
                  No data found
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row._id || i}>
                  <td>{start + i + 1}</td>

                  {columns.map((col) => (
                    <td key={col.header}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}

                  {actions && (
                    <td className="actions">
                      <div className="action-buttons">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Showing {total === 0 ? 0 : start + 1}–{Math.min(end, total)} of{" "}
          {total}
        </span>

        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ‹
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
