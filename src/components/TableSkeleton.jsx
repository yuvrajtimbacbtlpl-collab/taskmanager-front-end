// src/components/TableSkeleton.jsx
// Exact same as original — no changes to props or CSS

export default function TableSkeleton({
  columns = 4,
  rows = 5,
  showActions = true,
}) {
  const cols = Array(columns).fill(0);
  const rws = Array(rows).fill(0);

  return (
    <div className="common-table-card">
      <div className="table-wrapper">
        <table className="common-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              {cols.map((_, i) => (
                <th key={i}>
                  <div className="skeleton-box" style={{ height: 12 }} />
                </th>
              ))}
              {showActions && (
                <th style={{ width: 140 }}>
                  <div className="skeleton-box" style={{ height: 12 }} />
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rws.map((_, rowIndex) => (
              <tr key={rowIndex} className="skeleton-row">
                <td>
                  <div className="skeleton-box" style={{ width: 30 }} />
                </td>
                {cols.map((_, colIndex) => (
                  <td key={colIndex}>
                    <div className="skeleton-box" />
                  </td>
                ))}
                {showActions && (
                  <td>
                    <div className="action-buttons">
                      <div className="skeleton-circle" />
                      <div className="skeleton-circle" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
