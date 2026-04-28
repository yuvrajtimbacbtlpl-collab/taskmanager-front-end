// src/components/TaskTimeLog.jsx
// Shows time log history for a single task (used in task detail / view modal).
// Auto-refreshes when the timer is stopped.

import { useState, useEffect, useCallback } from "react";
import { Clock, Trash2, RefreshCw } from "lucide-react";
import { api } from "../api";

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
  return `${s}s`;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function TaskTimeLog({ taskId, refreshTrigger }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await api(`/timelogs/task/${taskId}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const handleDelete = async (logId) => {
    if (!window.confirm("Delete this time log entry?")) return;
    try {
      await api(`/timelogs/${logId}`, { method: "DELETE" });
      load();
    } catch {
      alert("Could not delete log.");
    }
  };

  if (loading) return (
    <div className="tl-empty"><RefreshCw size={14} className="tl-spin" /> Loading...</div>
  );

  if (!data || data.logs.length === 0) return (
    <div className="tl-empty">
      <Clock size={16} />
      <span>No time tracked yet. Click <b>Start Timer</b> above to begin.</span>
    </div>
  );

  return (
    <div className="tl-wrap">
      {/* Total badge */}
      <div className="tl-total-row">
        <Clock size={14} />
        <span>Total logged time:</span>
        <strong className="tl-total-val">{data.taskTotalFormatted}</strong>
        <button onClick={load} className="tl-refresh-btn" title="Refresh">
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Per-user summary if multiple users */}
      {data.perUser.length > 1 && (
        <div className="tl-per-user">
          {data.perUser.map((pu) => {
            const log = data.logs.find(l => String(l.user?._id) === pu.userId);
            const name = log?.user?.username || "User";
            return (
              <span key={pu.userId} className="tl-user-chip">
                {name}: {pu.formatted}
              </span>
            );
          })}
        </div>
      )}

      {/* Session list */}
      <div className="tl-list">
        {data.logs.map((log) => (
          <div key={log._id} className="tl-row">
            <div className="tl-row-left">
              <div className="tl-row-user">{log.user?.username || "—"}</div>
              <div className="tl-row-time">
                {fmtDate(log.startedAt)}
                <span className="tl-arrow">→</span>
                {log.stoppedAt ? fmtDate(log.stoppedAt) : "running…"}
              </div>
              {log.note && <div className="tl-row-note">"{log.note}"</div>}
            </div>
            <div className="tl-row-right">
              <span className="tl-duration">{fmt(log.durationSeconds)}</span>
              <button
                className="tl-del-btn"
                onClick={() => handleDelete(log._id)}
                title="Delete this entry"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tl-wrap { display:flex; flex-direction:column; gap:10px; }
        .tl-empty {
          display:flex; align-items:center; gap:8px;
          padding:14px 16px; background:var(--bg-subtle,#f8fafc);
          border:1px solid var(--border-subtle,#f1f5f9);
          border-radius:10px; font-size:13px; color:#64748b;
        }
        .tl-spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .tl-total-row {
          display:flex; align-items:center; gap:7px;
          font-size:13px; color:#64748b; padding:8px 0;
        }
        .tl-total-val { color:#1e293b; font-size:15px; margin-left:2px; }
        .tl-refresh-btn {
          margin-left:auto; background:none; border:none; color:#94a3b8;
          cursor:pointer; padding:4px; border-radius:5px; display:flex; align-items:center;
        }
        .tl-refresh-btn:hover { color:#6366f1; background:#eef2ff; }

        .tl-per-user { display:flex; flex-wrap:wrap; gap:6px; }
        .tl-user-chip {
          font-size:11.5px; padding:3px 10px; border-radius:20px;
          background:#eef2ff; color:#4f46e5; border:1px solid #c7d2fe;
        }

        .tl-list { display:flex; flex-direction:column; gap:6px; }
        .tl-row {
          display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
          padding:10px 14px; border-radius:9px;
          background:var(--bg-subtle,#f8fafc);
          border:1px solid var(--border-subtle,#f1f5f9);
        }
        .tl-row-left { display:flex; flex-direction:column; gap:3px; min-width:0; }
        .tl-row-user { font-size:12px; font-weight:700; color:#374151; }
        .tl-row-time { font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
        .tl-arrow    { color:#94a3b8; font-size:10px; }
        .tl-row-note { font-size:11px; color:#94a3b8; font-style:italic; margin-top:1px; }

        .tl-row-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .tl-duration  { font-size:13px; font-weight:700; color:#1e293b; font-family:monospace; }
        .tl-del-btn   {
          background:none; border:none; color:#94a3b8; cursor:pointer;
          padding:4px; border-radius:5px; display:flex; align-items:center;
          transition:all 0.15s;
        }
        .tl-del-btn:hover { color:#ef4444; background:#fff5f5; }

        /* Dark mode */
        [data-theme="dark"] .tl-total-val  { color:#e2e8f0; }
        [data-theme="dark"] .tl-row        { background:#162032; border-color:#2a3d52; }
        [data-theme="dark"] .tl-row-user   { color:#e2e8f0; }
        [data-theme="dark"] .tl-row-time   { color:#94a3b8; }
        [data-theme="dark"] .tl-duration   { color:#e2e8f0; }
        [data-theme="dark"] .tl-user-chip  { background:#1a1f3a; border-color:#3730a3; color:#a5b4fc; }
        [data-theme="dark"] .tl-empty      { background:#162032; border-color:#2a3d52; color:#64748b; }
      `}</style>
    </div>
  );
}