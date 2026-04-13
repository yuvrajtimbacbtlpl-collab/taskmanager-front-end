import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useGlobalSocket } from "../../context/GlobalSocketProvider";
import api from "../../api";
import {
  ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2,
  Calendar as CalIcon, Clock, Tag, AlignLeft, Save,
} from "lucide-react";

/* ── constants ── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EVENT_TYPES = [
  { value: "holiday",      label: "Holiday",       icon: "🏖️", bg: "#dcfce7", border: "#16a34a", text: "#166534" },
  { value: "off-day",      label: "Day Off",        icon: "🔴", bg: "#fee2e2", border: "#dc2626", text: "#991b1b" },
  { value: "meeting",      label: "Meeting",        icon: "📅", bg: "#dbeafe", border: "#2563eb", text: "#1e40af" },
  { value: "festival",     label: "Festival",       icon: "🎉", bg: "#fef9c3", border: "#d97706", text: "#854d0e" },
  { value: "announcement", label: "Announcement",   icon: "📢", bg: "#f3e8ff", border: "#7c3aed", text: "#6b21a8" },
  { value: "event",        label: "Event",          icon: "📌", bg: "#e0f2fe", border: "#0284c7", text: "#075985" },
];

const typeOf = (v) => EVENT_TYPES.find((t) => t.value === v) || EVENT_TYPES[5];

const fmtDate  = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtShort = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const toInputDate = (d) => new Date(d).toISOString().slice(0, 10);

/* ── tiny toast ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? "#fee2e2" : type === "warn" ? "#fef9c3" : "#dcfce7";
  const cl = type === "error" ? "#991b1b" : type === "warn" ? "#854d0e" : "#166534";
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:bg, color:cl,
      border:`1px solid ${cl}`, borderRadius:10, padding:"12px 20px", fontWeight:600,
      fontSize:14, display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 16px rgba(0,0,0,0.12)" }}>
      {msg}
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:cl, lineHeight:1 }}>✕</button>
    </div>
  );
}

/* ── event pill shown inside calendar cell ── */
function EventPill({ ev, onClick }) {
  const t = typeOf(ev.eventType);
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(ev); }}
      style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}`,
        borderRadius: 5, padding: "2px 6px", fontSize: 11, fontWeight: 600,
        marginBottom: 2, cursor: "pointer", whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
      title={ev.title}>
      {t.icon} {ev.title}
    </div>
  );
}

/* ── modal for view / create / edit ── */
function EventModal({ event, isOwner, onClose, onSave, onDelete, companyId }) {
  const isNew  = !event?._id;
  const [mode, setMode]  = useState(isNew ? "form" : "view");
  const [form, setForm]  = useState({
    title:       event?.title       || "",
    description: event?.description || "",
    eventType:   event?.eventType   || "event",
    startDate:   event?.startDate   ? toInputDate(event.startDate) : toInputDate(new Date()),
    endDate:     event?.endDate     ? toInputDate(event.endDate)   : toInputDate(new Date()),
    startTime:   event?.startTime   || "",
    endTime:     event?.endTime     || "",
    isAllDay:    event?.isAllDay !== false,
  });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDel]    = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const t   = typeOf(form.eventType);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, company: companyId };
      if (!event?._id) {
        const res = await api("/calendar", { method: "POST", body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" } });
        onSave(res.event, "created");
      } else {
        const res = await api(`/calendar/${event._id}`, { method: "PUT", body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" } });
        onSave(res.event, "updated");
      }
    } catch (e) {
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    setDel(true);
    try {
      await api(`/calendar/${event._id}`, { method: "DELETE" });
      onDelete(event._id);
    } catch (e) {
      alert(e.message || "Failed to delete");
      setDel(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.45)", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:500,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ background: t.border, padding:"18px 22px", borderRadius:"14px 14px 0 0",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:16 }}>
              {mode === "form" ? (isNew ? "New Event" : "Edit Event") : "Event Details"}
            </span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {!isNew && isOwner && mode === "view" && (
              <>
                <button onClick={() => setMode("form")} style={iconBtn("#ffffff30","white")}>
                  <Edit2 size={15}/>
                </button>
                <button onClick={handleDelete} disabled={deleting} style={iconBtn("#ffffff30","white")}>
                  <Trash2 size={15}/>
                </button>
              </>
            )}
            <button onClick={onClose} style={iconBtn("#ffffff30","white")}><X size={15}/></button>
          </div>
        </div>

        <div style={{ padding:"22px 24px" }}>
          {mode === "view" ? (
            /* ── VIEW MODE ── */
            <div>
              <h2 style={{ margin:"0 0 6px", fontSize:20, color:"#111827" }}>{event.title}</h2>
              <span style={{ display:"inline-block", background:t.bg, color:t.text,
                border:`1px solid ${t.border}`, borderRadius:20, fontSize:12,
                fontWeight:700, padding:"3px 12px", marginBottom:16 }}>
                {t.icon} {t.label}
              </span>

              <InfoRow icon={<CalIcon size={14}/>} label="Date">
                {fmtShort(event.startDate)}
                {toInputDate(event.startDate) !== toInputDate(event.endDate) && ` – ${fmtShort(event.endDate)}`}
              </InfoRow>
              <InfoRow icon={<Clock size={14}/>} label="Time">
                {event.isAllDay ? "All Day" : `${event.startTime || "—"} → ${event.endTime || "—"}`}
              </InfoRow>
              {event.description && (
                <InfoRow icon={<AlignLeft size={14}/>} label="Details">
                  {event.description}
                </InfoRow>
              )}
              <InfoRow icon={<Tag size={14}/>} label="Added By">
                {event.createdBy?.username || "—"}  ·  {fmtDate(event.createdAt)}
              </InfoRow>
            </div>
          ) : (
            /* ── FORM MODE ── */
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Event type */}
              <div>
                <label style={lbl}>Event Type</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {EVENT_TYPES.map((tp) => (
                    <button key={tp.value} onClick={() => set("eventType", tp.value)}
                      style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                        cursor:"pointer", transition:"all 0.15s",
                        background: form.eventType === tp.value ? tp.border : tp.bg,
                        color:      form.eventType === tp.value ? "#fff"    : tp.text,
                        border: `1px solid ${tp.border}` }}>
                      {tp.icon} {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Diwali Holiday, Weekly Sync..."
                  style={inputStyle} />
              </div>

              {/* Dates */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>Start Date *</label>
                  <input type="date" value={form.startDate}
                    onChange={(e) => { set("startDate", e.target.value);
                      if (!form.endDate || form.endDate < e.target.value) set("endDate", e.target.value); }}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={lbl}>End Date</label>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    style={inputStyle} />
                </div>
              </div>

              {/* All-day toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:14, color:"#374151" }}>
                  <input type="checkbox" checked={form.isAllDay}
                    onChange={(e) => set("isAllDay", e.target.checked)}
                    style={{ width:16, height:16, accentColor:"#4f46e5" }} />
                  All Day Event
                </label>
              </div>

              {/* Time (shown only when not all-day) */}
              {!form.isAllDay && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={lbl}>Start Time</label>
                    <input type="time" value={form.startTime}
                      onChange={(e) => set("startTime", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={lbl}>End Time</label>
                    <input type="time" value={form.endTime}
                      onChange={(e) => set("endTime", e.target.value)} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3} placeholder="Optional details, agenda, instructions..."
                  style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                style={{ background: saving ? "#9ca3af" : t.border, color:"#fff",
                  border:"none", borderRadius:8, padding:"12px 0", fontWeight:700,
                  fontSize:15, cursor: saving ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Save size={16}/> {saving ? "Saving…" : (isNew ? "Create Event" : "Save Changes")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* helper sub-components */
function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
      <span style={{ color:"#6b7280", marginTop:2, flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:14, color:"#374151" }}>{children}</div>
      </div>
    </div>
  );
}

const lbl = { display:"block", fontSize:12, color:"#6b7280", fontWeight:700,
  textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 };
const inputStyle = { width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:7, fontSize:14, color:"#111827", boxSizing:"border-box",
  outline:"none", fontFamily:"inherit" };
const iconBtn = (bg, color) => ({
  background: bg, border:"none", borderRadius:6, padding:"5px 7px",
  cursor:"pointer", color, display:"flex", alignItems:"center",
});

/* ══════════════════════════════════════
   MAIN CALENDAR PAGE
══════════════════════════════════════ */
export default function Calendar() {
  const { user, role } = useAuth();
  const { socket }     = useGlobalSocket();

  const today    = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);   // null | { mode:"new"|"view", event?, date? }
  const [toast,   setToast]   = useState(null);

  const companyId = user?.company?._id || user?.company;
  const isOwner   = ["ADMIN", "COMPANY_OWNER"].includes(role?.toUpperCase());

  /* ── fetch events for current month ── */
  const fetchEvents = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api(`/calendar?company=${companyId}&month=${month}&year=${year}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [companyId, month, year]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── join company socket room ── */
  useEffect(() => {
    if (!socket || !companyId) return;
    socket.emit("joinCompany", companyId);
    const onCreated = ({ event }) => setEvents((p) => [...p, event]);
    const onUpdated = ({ event }) => setEvents((p) => p.map((e) => e._id === event._id ? event : e));
    const onDeleted = ({ eventId }) => setEvents((p) => p.filter((e) => e._id !== eventId));
    socket.on("calendarEventCreated", onCreated);
    socket.on("calendarEventUpdated", onUpdated);
    socket.on("calendarEventDeleted", onDeleted);
    return () => {
      socket.off("calendarEventCreated", onCreated);
      socket.off("calendarEventUpdated", onUpdated);
      socket.off("calendarEventDeleted", onDeleted);
    };
  }, [socket, companyId]);

  /* ── month navigation ── */
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  /* ── build calendar grid ── */
  const firstDay     = new Date(year, month - 1, 1).getDay();
  const daysInMonth  = new Date(year, month, 0).getDate();
  const totalCells   = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells        = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });

  /* events on a specific day */
  const eventsOnDay = (day) => {
    if (!day) return [];
    const d = new Date(year, month - 1, day);
    return events.filter((ev) => {
      const s = new Date(ev.startDate); s.setHours(0,0,0,0);
      const e = new Date(ev.endDate);   e.setHours(23,59,59,999);
      return d >= s && d <= e;
    });
  };

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  /* ── modal handlers ── */
  const openNew  = (day) => {
    if (!isOwner || !day) return;
    const dt = new Date(year, month - 1, day);
    setModal({ mode:"new", date: toInputDate(dt) });
  };
  const openView = (ev) => setModal({ mode:"view", event: ev });

  const handleSave = (event, action) => {
    if (action === "created") {
      setEvents((p) => [...p.filter((e) => e._id !== event._id), event]);
      showToast(`✅ Event "${event.title}" created! All staff notified.`, "success");
    } else {
      setEvents((p) => p.map((e) => e._id === event._id ? event : e));
      showToast(`📝 Event "${event.title}" updated! All staff notified.`, "success");
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    setEvents((p) => p.filter((e) => e._id !== id));
    showToast("❌ Event deleted. Staff notified.", "warn");
    setModal(null);
  };

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── upcoming events list (next 30 days) ── */
  const upcoming = events
    .filter((ev) => new Date(ev.startDate) >= new Date(today.setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 8);

  /* ─────────────── RENDER ─────────────── */
  return (
    <div style={{ padding:"24px", maxWidth:1200, margin:"0 auto" }}>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {modal && (
        <EventModal
          event={modal.event || (modal.date ? { startDate: modal.date, endDate: modal.date } : null)}
          isOwner={isOwner}
          companyId={companyId}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:"#111827", display:"flex", alignItems:"center", gap:10 }}>
            <CalIcon size={26} color="#4f46e5"/> Company Calendar
          </h1>
          <p style={{ margin:"4px 0 0", fontSize:14, color:"#6b7280" }}>
            {isOwner ? "Manage company events. Staff are notified automatically via email." : "View company events, holidays and meetings."}
          </p>
        </div>
        {isOwner && (
          <button onClick={() => setModal({ mode:"new" })}
            style={{ background:"#4f46e5", color:"#fff", border:"none", borderRadius:9,
              padding:"10px 20px", fontWeight:700, fontSize:14, cursor:"pointer",
              display:"flex", alignItems:"center", gap:8 }}>
            <Plus size={16}/> Add Event
          </button>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>

        {/* ── CALENDAR GRID ── */}
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14,
          boxShadow:"0 1px 6px rgba(0,0,0,0.06)", overflow:"hidden" }}>

          {/* Month nav */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"16px 20px", borderBottom:"1px solid #e5e7eb", background:"#f9fafb" }}>
            <button onClick={prevMonth} style={navBtn}><ChevronLeft size={18}/></button>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#111827" }}>
              {MONTHS[month - 1]} {year}
            </h2>
            <button onClick={nextMonth} style={navBtn}><ChevronRight size={18}/></button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#f3f4f6" }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign:"center", padding:"8px 4px", fontSize:12,
                fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          {loading ? (
            <div style={{ textAlign:"center", padding:60, color:"#9ca3af", fontSize:14 }}>Loading calendar…</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
              {cells.map((day, idx) => {
                const dayEvents = eventsOnDay(day);
                const today_    = isToday(day);
                return (
                  <div key={idx}
                    onClick={() => openNew(day)}
                    style={{
                      minHeight: 96, padding:"6px 7px",
                      borderRight: (idx + 1) % 7 !== 0 ? "1px solid #f3f4f6" : "none",
                      borderBottom: idx < cells.length - 7  ? "1px solid #f3f4f6" : "none",
                      background: !day ? "#fafafa" : today_ ? "#eff6ff" : "#fff",
                      cursor: isOwner && day ? "pointer" : "default",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (isOwner && day) e.currentTarget.style.background = today_ ? "#dbeafe" : "#f9fafb"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = !day ? "#fafafa" : today_ ? "#eff6ff" : "#fff"; }}>

                    {day && (
                      <>
                        <div style={{ fontSize:13, fontWeight: today_ ? 800 : 500,
                          color: today_ ? "#2563eb" : "#374151",
                          background: today_ ? "#2563eb" : "transparent",
                          borderRadius: today_ ? "50%" : 0, width: today_ ? 24 : "auto",
                          height: today_ ? 24 : "auto", lineHeight: today_ ? "24px" : "normal",
                          textAlign: today_ ? "center" : "left", marginBottom:4 }}>
                          {day}
                        </div>
                        {dayEvents.slice(0, 3).map((ev) => (
                          <EventPill key={ev._id} ev={ev} onClick={openView} />
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, paddingLeft:4 }}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SIDEBAR: upcoming events + legend ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Legend */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
            padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:"#6b7280",
              textTransform:"uppercase", letterSpacing:"0.5px" }}>Event Types</h3>
            {EVENT_TYPES.map((t) => (
              <div key={t.value} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ width:12, height:12, borderRadius:3, flexShrink:0,
                  background:t.border }}/>
                <span style={{ fontSize:13, color:"#374151" }}>{t.icon} {t.label}</span>
              </div>
            ))}
          </div>

          {/* Upcoming events */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
            padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:"#6b7280",
              textTransform:"uppercase", letterSpacing:"0.5px" }}>Upcoming Events</h3>
            {upcoming.length === 0 ? (
              <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>No upcoming events</p>
            ) : (
              upcoming.map((ev) => {
                const t = typeOf(ev.eventType);
                return (
                  <div key={ev._id} onClick={() => openView(ev)}
                    style={{ padding:"10px 12px", borderRadius:8, marginBottom:8,
                      background:t.bg, border:`1px solid ${t.border}`, cursor:"pointer" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:2 }}>
                      {t.icon} {ev.title}
                    </div>
                    <div style={{ fontSize:11, color:t.text, opacity:0.8 }}>
                      {fmtShort(ev.startDate)}
                      {toInputDate(ev.startDate) !== toInputDate(ev.endDate) && ` – ${fmtShort(ev.endDate)}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:8,
  padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center",
  color:"#374151",
};