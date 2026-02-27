import { useState, useEffect } from "react";

const BASE_URL = "http://localhost:4000";

export default function TaskForm({
  task,                 // ✅ optional
  form: externalForm,   // ✅ from parent (CreateTask)
  setForm: setExternalForm,
  type = "task",
  staff = [],
  statuses = [],
  selectedProject,
  onCancel,
  onSubmit,
}) {

  /* ================= LOCAL STATE ================= */

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "",
    priority: "Normal",
    dueDate: "",
    media: [],
  });

  /* ================= SYNC WITH PARENT FORM ================= */

  useEffect(() => {
    if (externalForm) {
      setForm(externalForm);
    }
  }, [externalForm]);

  /* ================= LOAD EDIT DATA (Issue Page) ================= */

  useEffect(() => {
    if (task) {
      const editData = {
        title: task.title || "",
        description: task.description || "",
        assignedTo: task.assignedTo?._id || "",
        status: task.status || "",
        priority: task.priority || "Normal",
        dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
        media: task.media || [],
      };

      setForm(editData);
      if (setExternalForm) setExternalForm(editData);
    }
  }, [task]);

  /* ================= CHANGE HANDLER ================= */

  const updateForm = (data) => {
    setForm(data);
    if (setExternalForm) setExternalForm(data); // sync parent
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("assignedTo", form.assignedTo);
    formData.append("status", form.status);
    formData.append("priority", form.priority || "Normal");
    formData.append("type", type);

    if (form.dueDate) formData.append("dueDate", form.dueDate);
    if (selectedProject) formData.append("project", selectedProject._id);

    form.media.forEach((file) => {
      if (file instanceof File) formData.append("media", file);
    });

    onSubmit(formData);
  };

  return (
    <div className="staff-overlay">
      <div className="staff-form-card">

        <div className="staff-form-header">
          <h3>
            {task || externalForm
              ? `Edit ${type === "issue" ? "Issue" : "Task"}`
              : `Create ${type === "issue" ? "Issue" : "Task"}`}
          </h3>

          <span className="close-btn" onClick={onCancel}>✕</span>
        </div>

        <form onSubmit={handleSubmit}>

          {/* TITLE */}
          <div className="field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) =>
                updateForm({ ...form, title: e.target.value })
              }
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="field">
            <label>Description</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) =>
                updateForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* ASSIGNED */}
          <div className="field">
            <label>Assign To</label>
            <select
              value={form.assignedTo}
              onChange={(e) =>
                updateForm({ ...form, assignedTo: e.target.value })
              }
              required
            >
              <option value="">Select Staff</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.username}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                updateForm({ ...form, status: e.target.value })
              }
              required
            >
              <option value="">Select Status</option>
              {statuses.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* MEDIA */}
          <div className="field">
            <label>Upload Images / Videos</label>

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                updateForm({
                  ...form,
                  media: [...form.media, ...Array.from(e.target.files)],
                });
              }}
            />

            <div className="media-preview">
              {(form.media || []).map((file, index) => {
                const url =
                  file instanceof File
                    ? URL.createObjectURL(file)
                    : `${BASE_URL}/uploads/${file}`;

                const isVideo = (file.name || file).match(
                  /\.(mp4|mov|webm)$/i
                );

                return (
                  <div key={index} className="media-item">
                    {isVideo ? (
                      <video src={url} controls width="150" />
                    ) : (
                      <img src={url} alt="preview" width="150" />
                    )}

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        const updated = [...form.media];
                        updated.splice(index, 1);
                        updateForm(updated);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="btn-primary full">
            {task || externalForm
              ? `Update ${type === "issue" ? "Issue" : "Task"}`
              : `Create ${type === "issue" ? "Issue" : "Task"}`}
          </button>

        </form>
      </div>
    </div>
  );
}