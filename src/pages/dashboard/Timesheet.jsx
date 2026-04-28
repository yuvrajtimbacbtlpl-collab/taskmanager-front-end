// src/pages/dashboard/Timesheet.jsx
// Weekly timesheet page — staff sees their own, admin sees team.
// Route: /dashboard/timesheet

import { useState, useEffect, useCallback } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Clock, ChevronLeft, ChevronRight, Download, Users, User } from "lucide-react";
import "../../styles/Timesheet.css";

/* ── helpers ── */
function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// Get ISO week string for a date: "2026-15"
function getWeekStr(date = new Date()) {
  const d = new Date(date);
  d.setHours(12); // avoid DST edge
  const day = d.getDay() || 7; // Mon=1 … Sun=7
  d.setDate(d.getDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${new Date(date).getFullYear()}-${week}`;
}

function shiftWeek(weekStr, delta) {
  const [year, week] = weekStr.split("-").map(Number);
  const monday = getMondayOfWeek(year, week);
  monday.setDate(monday.getDate() + delta * 7);
  return getWeekStr(monday);
}

function getMondayOfWeek(year, week) {
  const jan4 = new Date(year, 0, 4);
  const dow  = jan4.getDay() || 7;
  const m    = new Date(jan4);
  m.setDate(jan4.getDate() - dow + 1 + (week - 1) * 7);
  m.setHours(0, 0, 0, 0);
  return m;
}

function weekLabel(weekStr) {
  const [year, week] = weekStr.split("-").map(Number);
  const mon = getMondayOfWeek(year, week);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  return `${fmt(mon)} – ${fmt(sun)}, ${year}`;
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function Timesheet() {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const [week,       setWeek]       = useState(getWeekStr());
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [viewMode,   setViewMode]   = useState("mine"); // "mine" | "team"
  const [filterUser, setFilterUser] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = viewMode === "team" && isAdmin
        ? `/timelogs/team?week=${week}${filterUser ? `&userId=${filterUser}` : ""}`
        : `/timelogs/my?week=${week}`;
      const res = await api(url);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [week, viewMode, filterUser, isAdmin]);

  useEffect(() => { load(); }, [load]);

  /* ── CSV export ── */
  const exportCSV = () => {
    if (!data?.logs?.length) return;
    const rows = [["User","Task","Project","Date","Start","End","Duration","Note"]];
    data.logs.forEach((l) => {
      rows.push([
        l.user?.username || "—",
        l.task?.title   || "—",
        l.project?.name || "—",
        new Date(l.startedAt).toLocaleDateString("en-IN"),
        fmtTime(l.startedAt),
        l.stoppedAt ? fmtTime(l.stoppedAt) : "running",
        fmt(l.durationSeconds),
        l.note || "",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `timesheet-${week}.csv`; a.click();
  };

  /* ── Build calendar grid from byDay ── */
  const buildGrid = () => {
    if (!data?.byDay) return [];
    const [year, weekNum] = week.split("-").map(Number);
    const monday = getMondayOfWeek(year, weekNum);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const logs = data.byDay[key] || [];
      const total = logs.reduce((s, l) => s + (l.durationSeconds || 0), 0);
      return { date: d, key, logs, total };
    });
  };

  const grid  = buildGrid();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="timesheet-page">

      {/* ── Header ── */}
      <div className="ts-page-header">
        <div className="ts-header-left">
          <Clock size={20} />
          <div>
            <h2>Timesheet</h2>
            <p>Track hours logged per task each week</p>
          </div>
        </div>
        <div className="ts-header-right">
          {isAdmin && (
            <div className="ts-view-toggle">
              <button
                className={`ts-toggle-btn ${viewMode==="mine" ? "active":""}`}
                onClick={() => setViewMode("mine")}
              ><User size={13} /> My time</button>
              <button
                className={`ts-toggle-btn ${viewMode==="team" ? "active":""}`}
                onClick={() => setViewMode("team")}
              ><Users size={13} /> Team</button>
            </div>
          )}
          <button className="ts-export-btn" onClick={exportCSV} disabled={!data?.logs?.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Week navigator ── */}
      <div className="ts-week-nav">
        <button className="ts-nav-btn" onClick={() => setWeek(w => shiftWeek(w, -1))}>
          <ChevronLeft size={16} />
        </button>
        <span className="ts-week-label">{weekLabel(week)}</span>
        <button className="ts-nav-btn" onClick={() => setWeek(w => shiftWeek(w, +1))}>
          <ChevronRight size={16} />
        </button>
        <button className="ts-today-btn" onClick={() => setWeek(getWeekStr())}>This week</button>

        {/* Total badge */}
        {data && (
          <span className="ts-total-badge">
            <Clock size={12} />
            {data.weekTotalFormatted} this week
          </span>
        )}
      </div>

      {loading && (
        <div className="ts-loading">Loading timesheet…</div>
      )}

      {!loading && data && (
        <>
          {/* ── Team summary (admin team view) ── */}
          {viewMode === "team" && data.summary?.length > 0 && (
            <div className="ts-team-summary">
              {data.summary.map((s) => (
                <div
                  key={s.user?._id}
                  className={`ts-team-card ${filterUser === String(s.user?._id) ? "active" : ""}`}
                  onClick={() => setFilterUser(f =>
                    f === String(s.user?._id) ? "" : String(s.user?._id)
                  )}
                >
                  <div className="ts-team-avatar">
                    {(s.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="ts-team-name">{s.user?.username}</div>
                  <div className="ts-team-time">{s.formatted}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Daily calendar grid ── */}
          <div className="ts-calendar">
            {grid.map((day, i) => (
              <div
                key={day.key}
                className={`ts-day-col ${day.key === today ? "today" : ""} ${day.total === 0 ? "empty" : ""}`}
              >
                <div className="ts-day-header">
                  <span className="ts-day-name">{DAYS[i]}</span>
                  <span className="ts-day-date">
                    {day.date.toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  </span>
                  {day.total > 0 && (
                    <span className="ts-day-total">{fmt(day.total)}</span>
                  )}
                </div>

                <div className="ts-day-logs">
                  {day.logs.length === 0 ? (
                    <div className="ts-day-empty">–</div>
                  ) : (
                    day.logs.map((log) => (
                      <div key={log._id} className="ts-log-entry">
                        <div className="ts-log-task">{log.task?.title || "Task"}</div>
                        {viewMode === "team" && (
                          <div className="ts-log-user">{log.user?.username}</div>
                        )}
                        <div className="ts-log-times">
                          {fmtTime(log.startedAt)} – {log.stoppedAt ? fmtTime(log.stoppedAt) : "…"}
                        </div>
                        <div className="ts-log-dur">{fmt(log.durationSeconds)}</div>
                        {log.note && <div className="ts-log-note">"{log.note}"</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── No logs ── */}
          {data.logs.length === 0 && (
            <div className="ts-no-data">
              <Clock size={32} />
              <p>No time logged this week.</p>
              <span>Go to any task and click <b>Start Timer</b> to begin tracking.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}