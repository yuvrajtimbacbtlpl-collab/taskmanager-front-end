// import { useState } from "react";
// import { api } from "../api";

// export default function StaffModal({ staff, onClose, onSuccess }) {
//   const isEdit = !!staff;

//   const [form, setForm] = useState({
//     username: staff?.username || "",
//     email: staff?.email || "",
//     role: staff?.role || "STAFF",
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState("");

//   const validate = () => {
//     const e = {};
//     if (!form.username.trim()) e.username = "Please enter name";

//     if (!isEdit) {
//       if (!form.email.trim()) e.email = "Please enter email";
//       else if (!/^\S+@\S+\.\S+$/.test(form.email))
//         e.email = "Please enter a valid email";
//     }

//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const submit = async () => {
//     if (!validate()) return;

//     try {
//       setLoading(true);
//       setMsg("");

//       if (isEdit) {
//         await api(`/auth/staff/${staff._id}`, {
//           method: "PUT",
//           body: {
//             username: form.username,
//             role: form.role,
//           },
//         });
//       } else {
//         await api("/auth/create-staff", {
//           method: "POST",
//           body: form,
//         });
//       }

//       onSuccess();
//     } catch (err) {
//       setMsg(err.message || "Action failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="staff-overlay">
//       <div className="staff-form-card">
//         <div className="staff-form-header">
//           <h3>{isEdit ? "Edit Staff" : "Create Staff"}</h3>
//           <span className="close-btn" onClick={onClose}>
//             ✕
//           </span>
//         </div>

//         <div className={`field ${errors.username ? "error" : ""}`}>
//           <label>Name</label>
//           <input
//             value={form.username}
//             onChange={(e) =>
//               setForm({ ...form, username: e.target.value })
//             }
//           />
//           {errors.username && <span>{errors.username}</span>}
//         </div>

//         <div className={`field ${errors.email ? "error" : ""}`}>
//           <label>Email</label>
//           <input
//             value={form.email}
//             disabled={isEdit}
//             onChange={(e) =>
//               setForm({ ...form, email: e.target.value })
//             }
//           />
//           {errors.email && <span>{errors.email}</span>}
//         </div>

//         <div className="field">
//           <label>Role</label>
//           <select
//             value={form.role}
//             onChange={(e) =>
//               setForm({ ...form, role: e.target.value })
//             }
//           >
//             <option value="STAFF">Staff</option>
//             <option value="ADMIN">Admin</option>
//           </select>
//         </div>

//         {msg && <p className="server-error">{msg}</p>}

//         <button
//           className="btn-primary full"
//           onClick={submit}
//           disabled={loading}
//         >
//           {loading ? "Saving..." : "Save"}
//         </button>
//       </div>
//     </div>
//   );
// }
