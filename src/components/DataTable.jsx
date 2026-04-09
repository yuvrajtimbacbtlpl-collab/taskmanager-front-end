import { useState, useEffect } from "react";

export default function CommonTable({
  columns,
  data,
  entriesOptions = [5, 10, 20],
  showEntries = true,
  actions,
}) {
  const [entries, setEntries] = useState(entriesOptions[0]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [entries, data]);

  const total = data.length;
  const totalPages = Math.ceil(total / entries) || 1;
  const start = (page - 1) * entries;
  const end = start + entries;
  const paginated = data.slice(start, end);

  return (
    <div className="common-table-card">
      {/* ===== TABLE CONTROLS ===== */}
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

      {/* ===== TABLE ===== */}
      <table className="common-table">
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col) => (
              <th key={col.header}>{col.header}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {paginated.length === 0 ? (
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
                    {col.render
                      ? col.render(row)
                      : row[col.accessor]}
                  </td>
                ))}

                {actions && (
                  <td className="actions">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ===== FOOTER ===== */}
      <div className="table-footer">
        <span>
          Showing {total === 0 ? 0 : start + 1}–
          {Math.min(end, total)} of {total}
        </span>

        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
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