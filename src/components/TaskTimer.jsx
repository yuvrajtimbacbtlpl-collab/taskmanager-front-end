// src/components/TaskTimer.jsx  — FIXED (v2)
// Bug fixed: was passing body: JSON.stringify({taskId}) which caused api.js
// to double-stringify it → malformed JSON → 400 from backend.
// Fix: pass body as plain object, no manual headers — api.js handles it.

import { useState, useEffect, useCallback } from "react";
import { Play, Square, Clock } from "lucide-react";
import { api } from "../api";

// Format seconds → "1h 23m 45s"
function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export default function TaskTimer({ taskId, taskTitle = "", compact = false }) {
  const [running,   setRunning]   = useState(false);
  const [logId,     setLogId]     = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed,   setElapsed]   = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [checking,  setChecking]  = useState(true);

  // On mount: check if this task already has a running timer
  useEffect(() => {
    let cancelled = false;
    api("/timelogs/running")
      .then((data) => {
        if (cancelled) return;
        if (
          data?.running &&
          String(data.running.task?._id || data.running.task) === String(taskId)
        ) {
          setRunning(true);
          setLogId(data.running._id);
          setStartedAt(new Date(data.running.startedAt));
          setElapsed(Math.floor((Date.now() - new Date(data.running.startedAt)) / 1000));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  // Live tick while running
  useEffect(() => {
    if (!running || !startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  // ✅ FIX: pass plain object as body — api.js will JSON.stringify it correctly
  const handleStart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/timelogs/start", {
        method: "POST",
        body: { taskId },           // ✅ plain object, NOT JSON.stringify({taskId})
      });
      setRunning(true);
      setLogId(data.log._id);
      setStartedAt(new Date(data.log.startedAt));
      setElapsed(0);
    } catch (err) {
      alert(err?.message || "Could not start timer. Try again.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // ✅ FIX: same here — plain object body
  const handleStop = useCallback(async () => {
    setLoading(true);
    try {
      await api("/timelogs/stop", {
        method: "POST",
        body: { logId },            // ✅ plain object, NOT JSON.stringify({logId})
      });
      setRunning(false);
      setLogId(null);
      setStartedAt(null);
      setElapsed(0);
    } catch (err) {
      alert(err?.message || "Could not stop timer. Try again.");
    } finally {
      setLoading(false);
    }
  }, [logId]);

  if (checking) return null;

  if (compact) {
    return (
      <button
        onClick={running ? handleStop : handleStart}
        disabled={loading}
        title={running ? `Stop timer (${fmt(elapsed)})` : `Start timer for "${taskTitle}"`}
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          "34px",
          height:         "34px",
          borderRadius:   "8px",
          border:         running ? "1.5px solid #dc2626" : "1.5px solid #e2e8f0",
          background:     running ? "#fff5f5" : "#f8fafc",
          color:          running ? "#dc2626" : "#64748b",
          cursor:         loading ? "not-allowed" : "pointer",
          transition:     "all 0.15s",
          position:       "relative",
          flexShrink:     0,
        }}
      >
        {running ? <Square size={14} /> : <Play size={14} />}
        {running && (
          <span style={{
            position:    "absolute",
            top:         "-5px",
            right:       "-5px",
            width:       "9px",
            height:      "9px",
            borderRadius:"50%",
            background:  "#ef4444",
            animation:   "timerPulse 1.2s ease infinite",
          }} />
        )}
        <style>{`
          @keyframes timerPulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.5; transform:scale(1.35); }
          }
          /* Dark mode for compact button */
          [data-theme="dark"] .timer-compact-stop {
            background: #2a0a0a !important; border-color: #7f1d1d !important; color: #f87171 !important;
          }
          [data-theme="dark"] .timer-compact-play {
            background: #1e293b !important; border-color: #2a3d52 !important; color: #94a3b8 !important;
          }
        `}</style>
      </button>
    );
  }

  // Full button — used inside task detail / view modal
  return (
    <div className="task-timer-full">
      {running && (
        <div className="timer-live-display">
          <span className="timer-dot" />
          <Clock size={14} />
          <span className="timer-clock">{fmt(elapsed)}</span>
          <span className="timer-label">tracking</span>
        </div>
      )}
      <button
        className={`timer-btn ${running ? "timer-btn--stop" : "timer-btn--start"}`}
        onClick={running ? handleStop : handleStart}
        disabled={loading}
      >
        {running ? <Square size={15} /> : <Play size={15} />}
        {loading ? "…" : running ? "Stop Timer" : "Start Timer"}
      </button>

      <style>{`
        @keyframes timerPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.35); }
        }
        .task-timer-full {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .timer-live-display {
          display: flex; align-items: center; gap: 6px;
          background: #fff5f5; border: 1.5px solid #fca5a5;
          border-radius: 8px; padding: 6px 12px;
          font-size: 13px; color: #dc2626; font-weight: 600;
        }
        .timer-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
          animation: timerPulse 1.2s ease infinite; flex-shrink: 0;
        }
        .timer-clock { font-family: monospace; font-size: 14px; letter-spacing: 0.5px; }
        .timer-label { font-size: 11px; color: #f87171; font-weight: 500; }

        .timer-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 9px; font-size: 13.5px;
          font-weight: 600; cursor: pointer; border: none;
          font-family: inherit; transition: all 0.15s;
        }
        .timer-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .timer-btn--start {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff; box-shadow: 0 2px 8px rgba(22,163,74,0.3);
        }
        .timer-btn--start:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(22,163,74,0.4);
        }
        .timer-btn--stop {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff; box-shadow: 0 2px 8px rgba(239,68,68,0.3);
        }
        .timer-btn--stop:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(239,68,68,0.4);
        }

        [data-theme="dark"] .timer-live-display {
          background: #2a0a0a; border-color: #7f1d1d; color: #f87171;
        }
        [data-theme="dark"] .timer-label { color: #fca5a5; }
      `}</style>
    </div>
  );
}