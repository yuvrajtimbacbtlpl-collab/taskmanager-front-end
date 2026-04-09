// import { Pencil, Trash2 } from "lucide-react";

// export default function StaffTable({
//   staff,
//   onEdit,
//   onDelete,
//   dimmed,
//   canEdit,
//   canDelete,
// }) {
//   return (
//     <div className={`staff-table-wrapper ${dimmed ? "blurred" : ""}`}>
//       <table className="staff-table">
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Email</th>
//             <th>Role</th>
//             <th className="actions">Actions</th>
//           </tr>
//         </thead>

//         <tbody>
//           {staff.length === 0 && (
//             <tr>
//               <td colSpan="4" className="empty">
//                 No staff found
//               </td>
//             </tr>
//           )}

//           {staff.map((s) => (
//             <tr key={s._id}>
//               <td>{s.username}</td>
//               <td>{s.email}</td>
//               <td>
//                 <span className={`role ${s.role.toLowerCase()}`}>
//                   {s.role === "STAFF" ? "Staff" : "Admin"}
//                 </span>
//               </td>

//               <td className="actions">
//                 {/* ✏️ EDIT */}
//                 {canEdit && (
//                   <button
//                     className="icon-btn"
//                     onClick={() => onEdit(s)}
//                   >
//                     <Pencil size={16} />
//                   </button>
//                 )}

//                 {/* 🗑️ DELETE */}
//                 {canDelete && (
//                   <button
//                     className="icon-btn danger"
//                     onClick={() => onDelete(s._id)}
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
