// src/components/NotificationBell.jsx
// Unified notification panel – tasks, issues, projects, chat, staff, company events
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import socket from "../socket";
import "../styles/NotificationBell.css";

/* ── Helpers ───────────────────────────────────────────── */
const TYPE_META = {
  task:    { icon: "✅", label: "Tasks" },
  issue:   { icon: "🐛", label: "Issues" },
  project: { icon: "📁", label: "Projects" },
  chat:    { icon: "💬", label: "Chat" },
  staff:   { icon: "👤", label: "Staff" },
  company: { icon: "🏢", label: "Company" },
  system:  { icon: "🔔", label: "System" },
};

const ALL_TABS = ["all", "task", "issue", "project", "chat", "staff", "company"];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ── Main Component ─────────────────────────────────────── */
export default function NotificationBell() {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [loading, setLoading]         = useState(false);
  const [tab, setTab]                 = useState("all");
  const wrapperRef                    = useRef(null);

  /* unread count derived from state */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* ── Fetch from API ───────────────────────────────────── */
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/notifications");
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  /* initial fetch */
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  /* ── Real-time socket listener ────────────────────────── */
  useEffect(() => {
    const onNew = (notif) => {
      setNotifs((prev) => {
        // avoid dupe by _id
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    };

    // Chat message notification bridge
    const onChatNotif = (data) => {
      const synthetic = {
        _id: `chat_${Date.now()}`,
        type: "chat",
        action: "message",
        title: data.roomName || "New Message",
        message: data.message || "You have a new chat message",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifs((prev) => [synthetic, ...prev].slice(0, 60));
    };

    socket.on("newNotification", onNew);
    socket.on("chatNotification", onChatNotif);

    return () => {
      socket.off("newNotification", onNew);
      socket.off("chatNotification", onChatNotif);
    };
  }, []);

  /* ── Close on outside click ───────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Actions ──────────────────────────────────────────── */
  const markRead = async (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try { await api(`/notifications/${id}/read`, { method: "PUT" }); } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await api("/notifications/mark-all-read", { method: "PUT" }); } catch { /* silent */ }
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    setNotifs((prev) => prev.filter((n) => n._id !== id));
    try { await api(`/notifications/${id}`, { method: "DELETE" }); } catch { /* silent */ }
  };

  const clearAll = async () => {
    setNotifs([]);
    try { await api("/notifications/clear-all", { method: "DELETE" }); } catch { /* silent */ }
  };

  /* ── Filtered list ────────────────────────────────────── */
  const displayed = tab === "all"
    ? notifications
    : notifications.filter((n) => n.type === tab);

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      {/* Bell trigger */}
      <button
        className="notif-btn"
        onClick={() => { setOpen((p) => !p); if (!open) fetchNotifs(); }}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="notif-panel" onMouseDown={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="notif-panel-count">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-panel-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={markAllRead} title="Mark all as read">
                  ✓ All read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="notif-action-btn danger" onClick={clearAll} title="Clear all">
                  🗑 Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="notif-filter-tabs">
            {ALL_TABS.map((t) => {
              const cnt = t === "all"
                ? notifications.length
                : notifications.filter((n) => n.type === t).length;
              if (t !== "all" && cnt === 0) return null;
              return (
                <button
                  key={t}
                  className={`notif-tab${tab === t ? " active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {TYPE_META[t]?.icon || "🔔"}{" "}
                  {TYPE_META[t]?.label || t}
                  {cnt > 0 && ` (${cnt})`}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="notif-list">
            {loading ? (
              [1, 2, 3].map((k) => (
                <div className="notif-skeleton" key={k}>
                  <div className="notif-skel-icon" />
                  <div className="notif-skel-lines">
                    <div className="notif-skel-line" />
                    <div className="notif-skel-line short" />
                  </div>
                </div>
              ))
            ) : displayed.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔕</div>
                <div className="notif-empty-text">
                  {tab === "all" ? "No notifications yet" : `No ${TYPE_META[tab]?.label || tab} notifications`}
                </div>
              </div>
            ) : (
              displayed.map((n) => (
                <div
                  key={n._id}
                  className={`notif-item${n.isRead ? "" : " unread"}`}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div className={`notif-icon ${n.type}`}>
                    {TYPE_META[n.type]?.icon || "🔔"}
                  </div>
                  <div className="notif-text">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    className="notif-del-btn"
                    onClick={(e) => deleteOne(e, n._id)}
                    title="Remove"
                  >×</button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-panel-footer">
            <span className="notif-footer-note">
              Notifications auto-expire after 30 days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
