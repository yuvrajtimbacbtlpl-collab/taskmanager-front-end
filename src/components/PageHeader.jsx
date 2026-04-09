// src/components/PageHeader.jsx
// Reusable page header — uses your existing .page-header CSS class
// Props:
//   title   — string (required)
//   actions — ReactNode (buttons on the right side)
//
// Usage example:
//   <PageHeader
//     title="Staff Management"
//     actions={
//       canCreate && (
//         <button className="btn-primary" onClick={() => setShowForm(true)}>
//           + Create Staff
//         </button>
//       )
//     }
//   />

export default function PageHeader({ title, actions }) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
