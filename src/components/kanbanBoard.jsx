import { useState, useRef, useCallback } from "react";
import { Pencil, Trash2, Eye, Timer, GripVertical, User, AlertTriangle, Clock } from "lucide-react";

/* ─── Priority config ─── */
const PRIORITY_CONFIG = {
  Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", dot: "#dc2626" },
  High:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  Normal:   { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  Low:      { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
};

/* ─── Column color palette ─── */
const COLUMN_COLORS = [
  { header: "#6366f1", light: "#eef2ff", border: "#c7d2fe", badge: "#4f46e5" },
  { header: "#0891b2", light: "#ecfeff", border: "#a5f3fc", badge: "#0e7490" },
  { header: "#d97706", light: "#fffbeb", border: "#fde68a", badge: "#b45309" },
  { header: "#16a34a", light: "#f0fdf4", border: "#86efac", badge: "#15803d" },
  { header: "#9333ea", light: "#faf5ff", border: "#d8b4fe", badge: "#7e22ce" },
  { header: "#dc2626", light: "#fef2f2", border: "#fca5a5", badge: "#b91c1c" },
  { header: "#0f766e", light: "#f0fdfa", border: "#99f6e4", badge: "#115e59" },
  { header: "#c2410c", light: "#fff7ed", border: "#fed7aa", badge: "#9a3412" },
];

function fmtShort(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(task) {
  if (!task.endDate) return false;
  const done = ["completed","done","closed","resolved"].some(s =>
    (task.status || "").toLowerCase().includes(s)
  );
  return !done && new Date(task.endDate) < new Date();
}

/* ─── Kanban Card ─── */
function KanbanCard({
  task, colColor, canUpdate, canDelete,
  onEdit, onDelete, onView,
  onDragStart, onDragEnd,
  isDraggingOver,
}) {
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Normal;
  const overdue = isOverdue(task);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e) => {
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
    onDragStart?.(task._id);
  };

  const handleDragEnd = () => {
    setDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: "#fff",
        borderRadius: "10px",
        border: `1.5px solid ${isDraggingOver ? colColor.border : "#e5e7eb"}`,
        boxShadow: dragging
          ? "0 16px 40px rgba(0,0,0,0.18)"
          : "0 1px 4px rgba(0,0,0,0.07)",
        padding: "12px",
        cursor: "grab",
        opacity: dragging ? 0.5 : 1,
        transform: dragging ? "rotate(2deg) scale(1.02)" : "none",
        transition: "box-shadow 0.18s, border-color 0.18s, opacity 0.15s",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Priority strip */}
      <div style={{
        position: "absolute", left: 0, top: "10px", bottom: "10px",
        width: "3px", borderRadius: "0 2px 2px 0",
        background: pc.dot,
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", paddingLeft: "8px" }}>
        <GripVertical size={13} color="#d1d5db" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 700, color: "#0f172a",
            lineHeight: "1.35", wordBreak: "break-word",
            marginBottom: "6px",
          }}>
            {task.title}
          </div>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", paddingLeft: "21px", marginBottom: "8px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px",
          background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
        }}>
          {task.priority || "Normal"}
        </span>
        {overdue && (
          <span style={{
            fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px",
            background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
            display: "flex", alignItems: "center", gap: "3px",
          }}>
            <AlertTriangle size={9} /> Overdue
          </span>
        )}
      </div>

      {/* Meta info */}
      <div style={{
        paddingLeft: "21px", display: "flex", flexDirection: "column",
        gap: "4px", fontSize: "11px", color: "#64748b",
      }}>
        {task.assignedTo?.username && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={10} />
            <span style={{ fontWeight: 500 }}>{task.assignedTo.username}</span>
          </div>
        )}
        {task.endDate && (
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            color: overdue ? "#dc2626" : "#64748b",
          }}>
            <Clock size={10} />
            <span>{overdue ? "⚠ " : ""}{fmtShort(task.endDate)}</span>
          </div>
        )}
        {task.estimatedHours && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Timer size={10} />
            <span>{task.estimatedHours}h est.</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{
        display: "flex", gap: "4px", justifyContent: "flex-end",
        marginTop: "10px", paddingTop: "8px",
        borderTop: "1px solid #f1f5f9",
      }}>
        <button
          onClick={e => { e.stopPropagation(); onView(task); }}
          title="View"
          style={actionBtn("#64748b")}
        >
          <Eye size={13} />
        </button>
        {canUpdate && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(task); }}
            title="Edit"
            style={actionBtn("#4f46e5")}
          >
            <Pencil size={13} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(task); }}
            title="Delete"
            style={actionBtn("#dc2626")}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function actionBtn(color) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "26px", height: "26px", borderRadius: "6px",
    border: `1px solid ${color}22`, background: `${color}0d`,
    color, cursor: "pointer", transition: "background 0.15s",
  };
}

/* ─── Kanban Column ─── */
function KanbanColumn({
  status, tasks, colColor,
  canUpdate, canDelete,
  onEdit, onDelete, onView,
  onDropTask, activeDragId,
}) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!ref.current?.contains(e.relatedTarget)) setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onDropTask(taskId, status.name);
  };

  return (
    <div
      ref={ref}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minWidth: "260px",
        width: "260px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        background: dragOver ? colColor.light : "#f8fafc",
        border: `2px dashed ${dragOver ? colColor.border : "transparent"}`,
        transition: "background 0.18s, border-color 0.18s",
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div style={{
        background: colColor.header,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: "13px", fontWeight: 700, color: "#fff",
          letterSpacing: "0.02em",
        }}>
          {status.name}
        </span>
        <span style={{
          background: "rgba(255,255,255,0.22)",
          color: "#fff",
          fontSize: "11px",
          fontWeight: 700,
          padding: "2px 9px",
          borderRadius: "20px",
          minWidth: "22px",
          textAlign: "center",
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards list */}
      <div style={{
        flex: 1,
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "120px",
        overflowY: "auto",
        maxHeight: "calc(100vh - 280px)",
      }}>
        {tasks.length === 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "80px", color: "#94a3b8", fontSize: "12px",
            border: "2px dashed #e2e8f0", borderRadius: "8px",
            background: dragOver ? colColor.light : "transparent",
          }}>
            {dragOver ? "Drop here" : "No items"}
          </div>
        )}
        {tasks.map(task => (
          <KanbanCard
            key={task._id}
            task={task}
            colColor={colColor}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            isDraggingOver={dragOver}
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />
        ))}
        {/* Drop zone at bottom */}
        {tasks.length > 0 && dragOver && (
          <div style={{
            height: "40px", borderRadius: "8px",
            border: `2px dashed ${colColor.border}`,
            background: colColor.light,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: colColor.badge,
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main KanbanBoard export ─── */
export default function KanbanBoard({
  tasks, statuses,
  canUpdate, canDelete,
  onEdit, onDelete, onView,
  onStatusChange,
}) {
  const [activeDragId, setActiveDragId] = useState(null);

  const handleDrop = useCallback(async (taskId, newStatus) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;
    onStatusChange(task, newStatus);
  }, [tasks, onStatusChange]);

  const grouped = statuses.reduce((acc, s) => {
    acc[s.name] = tasks.filter(t => t.status === s.name);
    return acc;
  }, {});

  return (
    <div style={{
      display: "flex",
      gap: "14px",
      overflowX: "auto",
      paddingBottom: "16px",
      paddingTop: "4px",
      minHeight: "300px",
    }}>
      {statuses.map((status, idx) => {
        const colColor = COLUMN_COLORS[idx % COLUMN_COLORS.length];
        return (
          <KanbanColumn
            key={status._id || status.name}
            status={status}
            tasks={grouped[status.name] || []}
            colColor={colColor}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onDropTask={handleDrop}
            activeDragId={activeDragId}
          />
        );
      })}

      {statuses.length === 0 && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94a3b8", fontSize: "14px", minHeight: "200px",
        }}>
          No statuses configured. Please add statuses in Task Status settings.
        </div>
      )}
    </div>
  );
}