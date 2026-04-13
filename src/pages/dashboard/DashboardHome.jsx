// src/pages/dashboard/DashboardHome.jsx
import { useEffect, useState, useCallback } from "react";
import { useAuth }    from "../../context/AuthContext";
import { useCompany } from "../../hooks/useCompany";
import { useLocation, NavLink } from "react-router-dom";
import { useGlobalSocket } from "../../context/GlobalSocketProvider";
import { api } from "../../api";
import WelcomePopup from "../../components/WelcomePopup";
import {
  Users, Shield, KeyRound, CheckSquare,
  FolderKanban, ChevronLeft, ChevronRight, Plus, X, Save,
} from "lucide-react";
import "../../styles/DashboardHome.css";

/* ─── helpers ─── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmtDateHeader() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const fmtShort = (d) => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric" });

/* ─── event type config ─── */
const EVENT_TYPES = [
  { value:"holiday",      label:"Holiday",      icon:"🏖️", bg:"#dcfce7", border:"#16a34a", text:"#166534" },
  { value:"off-day",      label:"Day Off",       icon:"🔴", bg:"#fee2e2", border:"#dc2626", text:"#991b1b" },
  { value:"meeting",      label:"Meeting",       icon:"📅", bg:"#dbeafe", border:"#2563eb", text:"#1e40af" },
  { value:"festival",     label:"Festival",      icon:"🎉", bg:"#fef9c3", border:"#d97706", text:"#854d0e" },
  { value:"announcement", label:"Announcement",  icon:"📢", bg:"#f3e8ff", border:"#7c3aed", text:"#6b21a8" },
  { value:"event",        label:"Event",         icon:"📌", bg:"#e0f2fe", border:"#0284c7", text:"#075985" },
];
const typeOf = (v) => EVENT_TYPES.find((t) => t.value === v) || EVENT_TYPES[5];

/* ─── event modal ─── */
function EventModal({ event, isNew, isOwner, companyId, onClose, onSave, onDelete }) {
  const [mode, setMode]   = useState(isNew ? "form" : "view");
  const [form, setForm]   = useState({
    title:       event?.title       || "",
    description: event?.description || "",
    eventType:   event?.eventType   || "event",
    startDate:   event?.startDate   ? toISO(event.startDate) : toISO(new Date()),
    endDate:     event?.endDate     ? toISO(event.endDate)   : toISO(new Date()),
    startTime:   event?.startTime   || "",
    endTime:     event?.endTime     || "",
    isAllDay:    event?.isAllDay !== false,
  });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err,      setErr]      = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const t   = typeOf(form.eventType);

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    setErr(""); setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description,
        eventType:   form.eventType,
        startDate:   form.startDate,
        endDate:     form.endDate || form.startDate,
        startTime:   form.isAllDay ? null : (form.startTime || null),
        endTime:     form.isAllDay ? null : (form.endTime   || null),
        isAllDay:    form.isAllDay,
        company:     companyId,
      };
      if (isNew || !event?._id) {
        const res = await api.post("/calendar", payload);
        onSave(res.event, "created");
      } else {
        const res = await api.put(`/calendar/${event._id}`, payload);
        onSave(res.event, "updated");
      }
    } catch (e) {
      setErr(e.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"? All staff will be notified.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/calendar/${event._id}`);
      onDelete(event._id);
    } catch (e) {
      setErr(e.message || "Delete failed.");
      setDeleting(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:2000, display:"flex",
      alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.48)", padding:16,
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:14, width:"100%", maxWidth:480,
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 24px 60px rgba(0,0,0,0.22)",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: t.border, padding:"16px 20px",
          borderRadius:"14px 14px 0 0",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>
              {mode === "form" ? (isNew ? "Add Event" : "Edit Event") : "Event Details"}
            </span>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {!isNew && isOwner && mode === "view" && (
              <>
                <button onClick={() => setMode("form")} style={iconBtnStyle}>✏️</button>
                <button onClick={handleDelete} disabled={deleting} style={iconBtnStyle}>
                  {deleting ? "…" : "🗑️"}
                </button>
              </>
            )}
            <button onClick={onClose} style={iconBtnStyle}><X size={14}/></button>
          </div>
        </div>

        <div style={{ padding:"20px 22px" }}>
          {mode === "view" ? (
            /* VIEW */
            <div>
              <h3 style={{ margin:"0 0 8px", fontSize:18, color:"#111827" }}>{event.title}</h3>
              <span style={{
                display:"inline-block", background:t.bg, color:t.text,
                border:`1px solid ${t.border}`, borderRadius:20,
                fontSize:12, fontWeight:700, padding:"3px 12px", marginBottom:16,
              }}>{t.icon} {t.label}</span>

              <div style={viewRow}>
                <span style={viewLabel}>📅 Date</span>
                <span style={viewVal}>
                  {fmtShort(event.startDate)}
                  {toISO(event.startDate) !== toISO(event.endDate) && ` → ${fmtShort(event.endDate)}`}
                </span>
              </div>
              <div style={viewRow}>
                <span style={viewLabel}>🕐 Time</span>
                <span style={viewVal}>{event.isAllDay ? "All Day" : `${event.startTime||"—"} → ${event.endTime||"—"}`}</span>
              </div>
              {event.description && (
                <div style={{ ...viewRow, borderBottom:"none" }}>
                  <span style={viewLabel}>📝 Details</span>
                  <span style={viewVal}>{event.description}</span>
                </div>
              )}
              {event.createdBy && (
                <div style={{ marginTop:12, fontSize:12, color:"#9ca3af" }}>
                  Added by {event.createdBy.username || "—"} · {fmtShort(event.createdAt)}
                </div>
              )}
            </div>
          ) : (
            /* FORM */
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Event type pills */}
              <div>
                <div style={labelStyle}>Event Type</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {EVENT_TYPES.map((tp) => (
                    <button key={tp.value} onClick={() => set("eventType", tp.value)} style={{
                      padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700,
                      cursor:"pointer", border:`1px solid ${tp.border}`,
                      background: form.eventType === tp.value ? tp.border : tp.bg,
                      color:      form.eventType === tp.value ? "#fff"    : tp.text,
                    }}>{tp.icon} {tp.label}</button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <div style={labelStyle}>Title *</div>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Diwali Holiday, Sprint Review…"
                  style={inputStyle} />
              </div>

              {/* Dates */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={labelStyle}>Start Date *</div>
                  <input type="date" value={form.startDate}
                    onChange={(e) => { set("startDate", e.target.value);
                      if (!form.endDate || form.endDate < e.target.value) set("endDate", e.target.value); }}
                    style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>End Date</div>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={(e) => set("endDate", e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* All day */}
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#374151" }}>
                <input type="checkbox" checked={form.isAllDay}
                  onChange={(e) => set("isAllDay", e.target.checked)}
                  style={{ width:15, height:15, accentColor:"#4f46e5" }} />
                All Day Event
              </label>

              {!form.isAllDay && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={labelStyle}>Start Time</div>
                    <input type="time" value={form.startTime}
                      onChange={(e) => set("startTime", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>End Time</div>
                    <input type="time" value={form.endTime}
                      onChange={(e) => set("endTime", e.target.value)} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <div style={labelStyle}>Description</div>
                <textarea value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2} placeholder="Optional details…"
                  style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
              </div>

              {err && (
                <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:7,
                  padding:"9px 14px", fontSize:13, fontWeight:600 }}>{err}</div>
              )}

              <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
                background: saving ? "#9ca3af" : t.border, color:"#fff",
                border:"none", borderRadius:8, padding:"11px 0", fontWeight:700,
                fontSize:14, cursor: saving ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              }}>
                <Save size={15}/>
                {saving ? "Saving…" : (isNew ? "Create & Notify Staff" : "Save Changes")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* modal style helpers */
const iconBtnStyle = {
  background:"rgba(255,255,255,0.2)", border:"none", borderRadius:6,
  padding:"5px 8px", cursor:"pointer", color:"#fff", fontSize:14,
  display:"flex", alignItems:"center",
};
const labelStyle = {
  fontSize:11, color:"#6b7280", fontWeight:700,
  textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5,
};
const inputStyle = {
  width:"100%", padding:"8px 11px", border:"1px solid #d1d5db",
  borderRadius:7, fontSize:13, color:"#111827",
  boxSizing:"border-box", outline:"none", fontFamily:"inherit",
};
const viewRow = {
  display:"flex", gap:12, padding:"9px 0",
  borderBottom:"1px solid #f3f4f6", alignItems:"flex-start",
};
const viewLabel = { fontSize:12, color:"#6b7280", fontWeight:600, minWidth:90, flexShrink:0 };
const viewVal   = { fontSize:13, color:"#374151" };

/* ─── mini calendar widget ─── */
/* ─── Day-events list (shown when a day has multiple events) ─── */
function DayEventsList({ dayLabel, events, isOwner, companyId, onClose, onEventSave, onEventDelete, onAddNew }) {
  const [viewing, setViewing] = useState(null);
  if (viewing) {
    return (
      <EventModal
        event={viewing}
        isNew={false}
        isOwner={isOwner}
        companyId={companyId}
        onClose={() => setViewing(null)}
        onSave={(ev, action) => { onEventSave(ev, action); setViewing(null); onClose(); }}
        onDelete={(id) => { onEventDelete(id); setViewing(null); onClose(); }}
      />
    );
  }
  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, display:"flex",
      alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.48)", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:400,
        boxShadow:"0 24px 60px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background:"#4f46e5", padding:"14px 18px", borderRadius:"14px 14px 0 0",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>📅 {dayLabel}</span>
          <button onClick={onClose} style={iconBtnStyle}><X size={14}/></button>
        </div>
        <div style={{ padding:"16px 18px" }}>
          {events.map((ev) => {
            const t = typeOf(ev.eventType);
            return (
              <div key={ev._id} onClick={() => setViewing(ev)}
                style={{ padding:"10px 12px", borderRadius:8, marginBottom:8, cursor:"pointer",
                  background:t.bg, border:`1px solid ${t.border}`,
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{t.icon} {ev.title}</div>
                  <div style={{ fontSize:11, color:t.text, opacity:0.75, marginTop:2 }}>
                    {ev.isAllDay ? "All Day" : `${ev.startTime||"—"} → ${ev.endTime||"—"}`}
                  </div>
                </div>
                <span style={{ fontSize:18 }}>›</span>
              </div>
            );
          })}
          {isOwner && (
            <button onClick={onAddNew}
              style={{ marginTop:4, width:"100%", background:"#4f46e5", color:"#fff",
                border:"none", borderRadius:8, padding:"9px 0", fontWeight:700,
                fontSize:13, cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:6 }}>
              <Plus size={14}/> Add Another Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ events: propEvents, isOwner, companyId, onEventSave, onEventDelete }) {
  const today = new Date();
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth() + 1);
  const [modal,   setModal]   = useState(null);
  // local events for this viewed month (merged with propEvents)
  const [monthEvents, setMonthEvents] = useState(propEvents);
  const [fetching,    setFetching]    = useState(false);

  // Re-sync when parent events change (socket updates, new saves)
  useEffect(() => { setMonthEvents(propEvents); }, [propEvents]);

  // Fetch events when month/year changes away from what parent already has
  useEffect(() => {
    if (!companyId) return;
    const nowM = today.getMonth() + 1;
    const nowY = today.getFullYear();
    // Parent already loaded current + next month — skip fetching those
    const isAlreadyLoaded =
      (year === nowY && month === nowM) ||
      (year === (nowM === 12 ? nowY + 1 : nowY) && month === (nowM === 12 ? 1 : nowM + 1));
    if (isAlreadyLoaded) { setMonthEvents(propEvents); return; }

    setFetching(true);
    api(`/calendar?company=${companyId}&month=${month}&year=${year}`)
      .then((data) => {
        if (Array.isArray(data)) {
          // merge with propEvents so we don't lose other months' data
          setMonthEvents((prev) => {
            const merged = [...propEvents];
            data.forEach((ev) => { if (!merged.find((x) => x._id === ev._id)) merged.push(ev); });
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, companyId]);

  const prevM = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextM = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells       = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });

  const eventsOnDay = (day) => {
    if (!day) return [];
    const d = new Date(year, month - 1, day);
    return monthEvents.filter((ev) => {
      const s = new Date(ev.startDate); s.setHours(0,0,0,0);
      const e = new Date(ev.endDate);   e.setHours(23,59,59,999);
      return d >= s && d <= e;
    });
  };

  const handleCellClick = (day) => {
    if (!day) return;
    const evs = eventsOnDay(day);
    const dt  = new Date(year, month - 1, day);
    const dtStr = toISO(dt);
    const dayLabel = dt.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });

    if (evs.length === 1) {
      setModal({ type:"view", event: evs[0] });
    } else if (evs.length > 1) {
      // Show list of all events for this day
      setModal({ type:"list", events: evs, dayLabel, prefill: { startDate: dtStr, endDate: dtStr } });
    } else if (isOwner) {
      setModal({ type:"new", prefill: { startDate: dtStr, endDate: dtStr } });
    }
  };

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  const handleSave = (ev, action) => { onEventSave(ev, action); setModal(null); };
  const handleDel  = (id)         => { onEventDelete(id);        setModal(null); };

  return (
    <>
      {/* Single event view */}
      {modal?.type === "view" && (
        <EventModal event={modal.event} isNew={false} isOwner={isOwner} companyId={companyId}
          onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDel} />
      )}
      {/* New event form */}
      {modal?.type === "new" && (
        <EventModal event={modal.prefill} isNew={true} isOwner={isOwner} companyId={companyId}
          onClose={() => setModal(null)} onSave={handleSave} onDelete={() => {}} />
      )}
      {/* Multiple events on same day */}
      {modal?.type === "list" && (
        <DayEventsList
          dayLabel={modal.dayLabel}
          events={modal.events}
          isOwner={isOwner}
          companyId={companyId}
          onClose={() => setModal(null)}
          onEventSave={handleSave}
          onEventDelete={handleDel}
          onAddNew={() => setModal({ type:"new", prefill: modal.prefill })}
        />
      )}

      {/* Month navigation */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prevM} style={calNavBtn}><ChevronLeft size={14}/></button>
        <span style={{ fontSize:13, fontWeight:700, color:"#1e293b", display:"flex", alignItems:"center", gap:6 }}>
          {MONTHS[month - 1]} {year}
          {fetching && <span style={{ fontSize:10, color:"#9ca3af" }}>…</span>}
        </span>
        <button onClick={nextM} style={calNavBtn}><ChevronRight size={14}/></button>
      </div>

      {/* Day labels */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {DAYS_SHORT.map((d) => (
          <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700,
            color:"#94a3b8", textTransform:"uppercase", padding:"0 0 4px" }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day, idx) => {
          const evs  = eventsOnDay(day);
          const tod  = isToday(day);
          const hasE = evs.length > 0;
          // Use the color of the "most important" event type on this day
          const dotColor = hasE ? typeOf(evs[0].eventType).border : null;
          return (
            <div key={idx} onClick={() => handleCellClick(day)}
              style={{
                height:34, borderRadius:7, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", position:"relative",
                background: !day ? "transparent" : tod ? "#4f46e5" : hasE ? "#eef2ff" : "transparent",
                cursor: day ? (isOwner || hasE ? "pointer" : "default") : "default",
                transition:"background 0.15s",
              }}
              title={hasE ? evs.map((e) => `${typeOf(e.eventType).icon} ${e.title}`).join("\n") : ""}
              onMouseEnter={(e) => { if (day && !tod) e.currentTarget.style.background = hasE ? "#e0e7ff" : "#f8fafc"; }}
              onMouseLeave={(e) => { if (day) e.currentTarget.style.background = !day ? "transparent" : tod ? "#4f46e5" : hasE ? "#eef2ff" : "transparent"; }}
            >
              {day && (
                <>
                  <span style={{
                    fontSize:12, fontWeight: tod ? 800 : hasE ? 700 : 400,
                    color: tod ? "#fff" : hasE ? "#4f46e5" : "#374151",
                    lineHeight:1,
                  }}>{day}</span>
                  {/* Dots for events — up to 3 colored dots */}
                  {hasE && (
                    <div style={{ display:"flex", gap:2, marginTop:2 }}>
                      {evs.slice(0,3).map((ev, i) => (
                        <div key={i} style={{
                          width:4, height:4, borderRadius:"50%",
                          background: tod ? "#fff" : typeOf(ev.eventType).border,
                        }}/>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && (
        <button onClick={() => setModal({ type:"new", prefill:{ startDate: toISO(new Date()), endDate: toISO(new Date()) } })}
          style={{
            marginTop:14, width:"100%", background:"#4f46e5", color:"#fff",
            border:"none", borderRadius:8, padding:"9px 0", fontWeight:700,
            fontSize:13, cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", gap:6,
          }}>
          <Plus size={14}/> Add Event
        </button>
      )}
    </>
  );
}

const calNavBtn = {
  background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:6,
  padding:"4px 8px", cursor:"pointer", display:"flex", alignItems:"center",
  color:"#374151",
};

/* ══════════════════════════════════════════
   DASHBOARD HOME
══════════════════════════════════════════ */
export default function DashboardHome() {
  const location = useLocation();
  const { user, role } = useAuth();
  const { socket }     = useGlobalSocket();
  const { isAdmin, selectedCompany } = useCompany();

  const [stats, setStats] = useState({
    totalRoles:0, totalPermissions:0, totalUsers:0,
    totalTasks:0, totalProjects:0,
  });
  const [recent,       setRecent]       = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showWelcome,  setShowWelcome]  = useState(false);

  /* calendar state */
  const [calEvents,    setCalEvents]    = useState([]);
  const [calLoading,   setCalLoading]   = useState(true);

  const companyId = user?.company?._id || user?.company;
  const isOwner   = ["ADMIN", "COMPANY_OWNER"].includes(role?.toUpperCase());

  /* fetch dashboard stats */
  useEffect(() => { if (isAdmin) fetchData(); }, [selectedCompany]);
  useEffect(() => {
    fetchData();
    fetchCalendar();
    const flag = sessionStorage.getItem("showWelcome");
    if (flag === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("showWelcome");
      const t = setTimeout(() => setShowWelcome(false), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoadingStats(true);
      const [roles, perms, users, projects, tasks] = await Promise.allSettled([
        api("/roles"), api("/permissions"), api("/auth/staff"),
        api("/projects"), api("/tasks?limit=5"),
      ]);
      const rv = (r) => (r.status === "fulfilled" ? r.value : null);
      const rolesData    = rv(roles);
      const permsData    = rv(perms);
      const usersData    = rv(users);
      const projectsData = rv(projects);
      const tasksRes     = rv(tasks);

      setStats({
        totalRoles:       Array.isArray(rolesData)    ? rolesData.length    : 0,
        totalPermissions: Array.isArray(permsData)    ? permsData.length    : 0,
        totalUsers:       Array.isArray(usersData)    ? usersData.length    : usersData?.total ?? 0,
        totalProjects:    Array.isArray(projectsData) ? projectsData.length : 0,
        totalTasks:       tasksRes?.totalRecords ?? (Array.isArray(tasksRes) ? tasksRes.length : 0),
      });
      const taskArr = tasksRes?.data ?? (Array.isArray(tasksRes) ? tasksRes : []);
      setRecent(taskArr.slice(0, 5));
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  /* fetch calendar events for this month + next */
  const fetchCalendar = useCallback(async () => {
    if (!companyId) { setCalLoading(false); return; }
    setCalLoading(true);
    try {
      const now = new Date();
      // fetch 2 months worth to cover any calendar navigation
      const [m1, m2] = await Promise.allSettled([
        api(`/calendar?company=${companyId}&month=${now.getMonth()+1}&year=${now.getFullYear()}`),
        api(`/calendar?company=${companyId}&month=${now.getMonth()+2 > 12 ? 1 : now.getMonth()+2}&year=${now.getMonth()+2 > 12 ? now.getFullYear()+1 : now.getFullYear()}`),
      ]);
      const ev1 = m1.status === "fulfilled" && Array.isArray(m1.value) ? m1.value : [];
      const ev2 = m2.status === "fulfilled" && Array.isArray(m2.value) ? m2.value : [];
      // merge & deduplicate
      const merged = [...ev1, ...ev2.filter((e) => !ev1.find((x) => x._id === e._id))];
      setCalEvents(merged);
    } catch { setCalEvents([]); }
    finally { setCalLoading(false); }
  }, [companyId]);

  /* real-time socket updates */
  useEffect(() => {
    if (!socket || !companyId) return;
    socket.emit("joinCompany", companyId);
    const onCreated = ({ event }) => setCalEvents((p) => [...p.filter((e) => e._id !== event._id), event]);
    const onUpdated = ({ event }) => setCalEvents((p) => p.map((e) => e._id === event._id ? event : e));
    const onDeleted = ({ eventId }) => setCalEvents((p) => p.filter((e) => e._id !== eventId));
    socket.on("calendarEventCreated", onCreated);
    socket.on("calendarEventUpdated", onUpdated);
    socket.on("calendarEventDeleted", onDeleted);
    return () => {
      socket.off("calendarEventCreated", onCreated);
      socket.off("calendarEventUpdated", onUpdated);
      socket.off("calendarEventDeleted", onDeleted);
    };
  }, [socket, companyId]);

  const handleCalSave = (event, action) => {
    if (action === "created") setCalEvents((p) => [...p.filter((e) => e._id !== event._id), event]);
    else setCalEvents((p) => p.map((e) => e._id === event._id ? event : e));
  };
  const handleCalDelete = (id) => setCalEvents((p) => p.filter((e) => e._id !== id));

  /* upcoming events (next 5) */
  const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
  const upcoming = calEvents
    .filter((ev) => new Date(ev.endDate) >= todayMidnight)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  const statCards = [
    { label:"Projects",    value: stats.totalProjects,    icon: FolderKanban, color:"#6366f1" },
    { label:"Tasks",       value: stats.totalTasks,       icon: CheckSquare,  color:"#0ea5e9" },
    { label:"Staff",       value: stats.totalUsers,       icon: Users,        color:"#10b981" },
    { label:"Roles",       value: stats.totalRoles,       icon: Shield,       color:"#f59e0b" },
    { label:"Permissions", value: stats.totalPermissions, icon: KeyRound,     color:"#ec4899" },
  ];

  const quickLinks = [
    { to:"/dashboard/task",         icon:"✅", label:"New Task",    color:"#eef2ff" },
    { to:"/dashboard/projects",     icon:"📁", label:"Projects",    color:"#f0fdf4" },
    { to:"/dashboard/create-staff", icon:"👤", label:"Staff",       color:"#fef9c3" },
    { to:"/dashboard/chat",         icon:"💬", label:"Chat",        color:"#e0f2fe" },
    { to:"/dashboard/issues",       icon:"🐛", label:"Issues",      color:"#fff1f2" },
    { to:"/dashboard/task-status",  icon:"🏷️", label:"Task Status", color:"#f5f3ff" },
  ];

  return (
    <div className="dashboard-wrapper">
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}

      <div className={`dashboard-home ${showWelcome ? "blurred" : ""}`}>

        {/* Welcome bar */}
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-left">
            <h2 className="dashboard-title">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
              {user?.username?.split(" ")[0] || "there"} 👋
            </h2>
            <p className="dashboard-subtitle">
              Here's what's happening{isAdmin && selectedCompany?.name ? ` at ${selectedCompany.name}` : ""} today.
            </p>
          </div>
          <div className="dashboard-date-chip">
            📅 <span>{fmtDateHeader()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="stat-card" key={card.label} style={{ "--stat-color": card.color }}>
                <div className="stat-icon" style={{ background: card.color + "18", color: card.color }}>
                  <Icon size={22} />
                </div>
                <div className="stat-info">
                  <h4>{card.label}</h4>
                  <p>{loadingStats ? <span className="skeleton-box" style={{ width:44, height:28 }}/> : card.value.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lower 3-column: Tasks | Calendar | Quick Links */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }} className="dash-lower-3">

          {/* Recent Tasks */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Recent Tasks</h3>
              {recent.length > 0 && <span className="dash-section-badge">{recent.length}</span>}
            </div>
            {loadingStats ? (
              [1,2,3].map((k) => (
                <div className="recent-item" key={k}>
                  <div className="recent-item-left">
                    <div className="skeleton-box" style={{ width:"70%", height:13 }}/>
                    <div className="skeleton-box" style={{ width:"40%", height:11, marginTop:5 }}/>
                  </div>
                  <div className="skeleton-box" style={{ width:52, height:20, borderRadius:20 }}/>
                </div>
              ))
            ) : recent.length === 0 ? (
              <div style={{ color:"#94a3b8", fontSize:13.5, padding:"16px 0" }}>
                No tasks yet — create your first task.
              </div>
            ) : (
              recent.map((task) => (
                <div className="recent-item" key={task._id}>
                  <div className="recent-item-left">
                    <span className="recent-item-title">
                      <span className={`priority-dot ${task.priority || "Normal"}`}/>
                      {task.title}
                    </span>
                    <span className="recent-item-sub">
                      {task.assignedTo?.username ? `→ ${task.assignedTo.username}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="recent-item-right">
                    <span className="recent-item-time">{timeAgo(task.createdAt)}</span>
                    {task.status && <span className="recent-item-status">{task.status}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── CALENDAR WIDGET ── */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">📅 Calendar</h3>
              {isOwner && (
                <span style={{ fontSize:11, color:"#6b7280" }}>Click date to add</span>
              )}
            </div>
            {calLoading ? (
              <div style={{ textAlign:"center", padding:"30px 0", color:"#94a3b8", fontSize:13 }}>
                Loading…
              </div>
            ) : (
              <MiniCalendar
                events={calEvents}
                isOwner={isOwner}
                companyId={companyId}
                onEventSave={handleCalSave}
                onEventDelete={handleCalDelete}
              />
            )}
          </div>

          {/* Quick Links + Upcoming Events */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            <div className="dash-section">
              <div className="dash-section-header">
                <h3 className="dash-section-title">Quick Access</h3>
              </div>
              <div className="quick-links-grid">
                {quickLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="quick-link-btn">
                    <div className="quick-link-icon" style={{ background: link.color }}>{link.icon}</div>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Upcoming events list */}
            {upcoming.length > 0 && (
              <div className="dash-section">
                <div className="dash-section-header">
                  <h3 className="dash-section-title">Upcoming Events</h3>
                  <span className="dash-section-badge">{upcoming.length}</span>
                </div>
                {upcoming.map((ev) => {
                  const t = typeOf(ev.eventType);
                  return (
                    <div key={ev._id} style={{
                      padding:"8px 10px", borderRadius:8, marginBottom:7,
                      background:t.bg, border:`1px solid ${t.border}`, cursor:"default",
                    }}>
                      <div style={{ fontSize:12, fontWeight:700, color:t.text }}>
                        {t.icon} {ev.title}
                      </div>
                      <div style={{ fontSize:11, color:t.text, opacity:0.75, marginTop:1 }}>
                        {fmtShort(ev.startDate)}
                        {toISO(ev.startDate) !== toISO(ev.endDate) && ` → ${fmtShort(ev.endDate)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}