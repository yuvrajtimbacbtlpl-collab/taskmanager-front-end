// src/pages/dashboard/CompanyPage.jsx
// Company Directory — cards with soft delete, restore, permanent delete + audit log
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import {
  Building2, User, Mail, Calendar, Trash2,
  RotateCcw, X, AlertTriangle, ShieldCheck,
  Activity, Flame, ClipboardList, Clock,
} from "lucide-react";
import "../../styles/CompanyPage.css";

/* ── helpers ── */
const fmt     = (d) => d ? new Date(d).toLocaleDateString("en-IN",  { day:"2-digit", month:"short",  year:"numeric" }) : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleString("en-IN",      { day:"2-digit", month:"short",  year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true }) : "—";
const initial = (n) => (n || "C")[0].toUpperCase();

/* ─────────────────────────────────────────────────────────────
   UNIVERSAL CONFIRM MODAL
───────────────────────────────────────────────────────────── */
function ConfirmModal({ type, company, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onCancel]);

  const cfg = {
    delete:  {
      icon: <Trash2 size={30} />, wrapClass: "delete",
      title: "Move to Trash?",
      msg: <>You're soft-deleting <strong>{company?.name}</strong>. This is reversible.</>,
      effects: ["Move company to Trash (recoverable)", "Deactivate all staff accounts", "Hide all projects, tasks & issues", "Restore anytime from the Trash tab"],
      effectClass: "warn",
      confirmLabel: <><Trash2 size={14} /> Move to Trash</>,
      btnClass: "cp-btn-delete",
    },
    restore: {
      icon: <RotateCcw size={30} />, wrapClass: "restore",
      title: "Restore Company?",
      msg: <>You're restoring <strong>{company?.name}</strong> and all its data.</>,
      effects: ["Company becomes active again", "All staff accounts re-activated", "All projects, tasks & issues restored"],
      effectClass: "good",
      confirmLabel: <><RotateCcw size={14} /> Yes, Restore</>,
      btnClass: "cp-btn-restore",
    },
    permanent: {
      icon: <Flame size={30} />, wrapClass: "permanent",
      title: "Permanently Delete?",
      msg: <><strong className="text-red">{company?.name}</strong> — this <strong>CANNOT be undone.</strong></>,
      effects: ["All projects permanently removed", "All tasks & issues permanently removed", "All staff accounts permanently deleted", "Company data wiped forever", "A record is saved in the Deleted Log"],
      effectClass: "danger",
      confirmLabel: <><Flame size={14} /> Delete Forever</>,
      btnClass: "cp-btn-permanent",
    },
  }[type];

  return createPortal(
    <div className="cp-modal-overlay" onClick={onCancel}>
      <div className="cp-modal-card" onClick={(e) => e.stopPropagation()}>

        <button className="cp-modal-close" onClick={onCancel}><X size={15} /></button>

        <div className={`cp-modal-icon-wrap ${cfg.wrapClass}`}>
          {cfg.icon}
        </div>

        <h3 className="cp-modal-title">{cfg.title}</h3>
        <p className="cp-modal-msg">{cfg.msg}</p>

        <div className={`cp-modal-effects ${cfg.effectClass}`}>
          <div className="cp-effects-header">
            {type === "permanent" ? <><AlertTriangle size={13} /> This will permanently:</> : <><ShieldCheck size={13} /> This will:</>}
          </div>
          <ul>
            {cfg.effects.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>

        <div className="cp-modal-actions">
          <button className="cp-btn cp-btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={`cp-btn ${cfg.btnClass}`} onClick={onConfirm} disabled={loading}>
            {loading
              ? <span className="cp-btn-loading"><span className="cp-spinner" />Working…</span>
              : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────────────────────
   ACTIVE COMPANY CARD
───────────────────────────────────────────────────────────── */
function ActiveCard({ company, isAdmin, onDelete }) {
  return (
    <div className="company-card active">
      <div className="company-card-header">
        <div className="cc-avatar active">{initial(company.name)}</div>
        <div className="cc-header-info">
          <h3 className="cc-name">{company.name}</h3>
          <span className="cc-id">#{company._id.slice(-6).toUpperCase()}</span>
        </div>
        <span className="cc-status-dot active" title="Active" />
      </div>

      <div className="company-card-body">
        <p className="cc-section-label">Owner Information</p>
        <div className="cc-rows">
          <div className="cc-row">
            <span className="cc-row-icon"><User size={15} /></span>
            <div><span className="cc-row-label">Name</span><span className="cc-row-val">{company.owner?.username || "Not assigned"}</span></div>
          </div>
          <div className="cc-row">
            <span className="cc-row-icon"><Mail size={15} /></span>
            <div><span className="cc-row-label">Email</span><span className="cc-row-val">{company.owner?.email || company.email || "—"}</span></div>
          </div>
          <div className="cc-row">
            <span className="cc-row-icon"><Calendar size={15} /></span>
            <div><span className="cc-row-label">Registered</span><span className="cc-row-val">{fmt(company.createdAt)}</span></div>
          </div>
        </div>
      </div>

      <div className="company-card-footer active">
        <div className="cc-footer-tags">
          <span className="cc-tag green"><ShieldCheck size={12} /> Verified</span>
          <span className="cc-tag gray"><Activity size={12} /> Active</span>
        </div>
        {isAdmin && (
          <button className="cc-action-btn delete" onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DELETED COMPANY CARD (TRASH)
───────────────────────────────────────────────────────────── */
function DeletedCard({ company, onRestore, onPermanent }) {
  return (
    <div className="company-card deleted">
      <div className="company-card-header deleted">
        <div className="cc-avatar deleted">{initial(company.name)}</div>
        <div className="cc-header-info">
          <h3 className="cc-name deleted">{company.name}</h3>
          <span className="cc-id deleted">#{company._id.slice(-6).toUpperCase()}</span>
        </div>
        <span className="cc-deleted-badge">🗑️ Trash</span>
      </div>

      <div className="company-card-body">
        <p className="cc-section-label">Deletion Info</p>
        <div className="cc-rows">
          <div className="cc-row">
            <span className="cc-row-icon red"><Clock size={15} /></span>
            <div><span className="cc-row-label">Deleted On</span><span className="cc-row-val">{fmtFull(company.deletedAt)}</span></div>
          </div>
          <div className="cc-row">
            <span className="cc-row-icon red"><User size={15} /></span>
            <div><span className="cc-row-label">Deleted By</span><span className="cc-row-val">{company.deletedBy?.username || company.deletedBy?.email || "Super Admin"}</span></div>
          </div>
          <div className="cc-row">
            <span className="cc-row-icon"><Calendar size={15} /></span>
            <div><span className="cc-row-label">Originally Registered</span><span className="cc-row-val">{fmt(company.createdAt)}</span></div>
          </div>
        </div>
      </div>

      <div className="company-card-footer deleted">
        <p className="cc-deleted-notice">
          <AlertTriangle size={12} /> All staff, projects &amp; tasks are deactivated
        </p>
        <div className="cc-footer-actions">
          <button className="cc-action-btn restore" onClick={onRestore}>
            <RotateCcw size={13} /> Restore
          </button>
          <button className="cc-action-btn permanent" onClick={onPermanent}>
            <Flame size={13} /> Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DELETED LOG ROW
───────────────────────────────────────────────────────────── */
function LogRow({ log, index }) {
  return (
    <tr>
      <td className="log-td-num">{index + 1}</td>
      <td>
        <div className="log-company-cell">
          <div className="log-avatar">{initial(log.name)}</div>
          <div>
            <div className="log-name">{log.name}</div>
            <div className="log-email">{log.email || "—"}</div>
          </div>
        </div>
      </td>
      <td><span className="log-date">{fmt(log.companyCreatedAt)}</span></td>
      <td>
        <div className="log-counts">
          <span title="Projects">📁 {log.projectCount}</span>
          <span title="Tasks">✅ {log.taskCount}</span>
          <span title="Staff">👤 {log.staffCount}</span>
        </div>
      </td>
      <td><span className="log-who">{log.permanentlyDeletedByName || "Super Admin"}</span></td>
      <td><span className="log-date red">{fmtFull(log.createdAt)}</span></td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function CompanyPage() {
  const { role } = useAuth();
  const isAdmin = role?.toUpperCase() === "ADMIN";

  const [activeTab,      setActiveTab]      = useState("active");
  const [companies,      setCompanies]      = useState([]);
  const [deletedList,    setDeletedList]    = useState([]);
  const [deletedLog,     setDeletedLog]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [logLoading,     setLogLoading]     = useState(false);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [modal,          setModal]          = useState(null); // { type, company }
  const [toast,          setToast]          = useState(null);

  /* ── toasts ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── fetch helpers ── */
  const fetchActive = useCallback(async () => {
    setLoading(true);
    try { setCompanies(Array.isArray(await api("/company")) ? await api("/company") : []); }
    catch { setCompanies([]); } finally { setLoading(false); }
  }, []);

  // cleaner version
  const loadActive = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/company");
      setCompanies(Array.isArray(d) ? d : []);
    } catch { setCompanies([]); } finally { setLoading(false); }
  }, []);

  const loadDeleted = useCallback(async () => {
    setDeletedLoading(true);
    try {
      const d = await api("/company/deleted");
      setDeletedList(Array.isArray(d) ? d : []);
    } catch { setDeletedList([]); } finally { setDeletedLoading(false); }
  }, []);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const d = await api("/company/deleted-log");
      setDeletedLog(Array.isArray(d) ? d : []);
    } catch { setDeletedLog([]); } finally { setLogLoading(false); }
  }, []);

  useEffect(() => { loadActive(); }, [loadActive]);
  useEffect(() => {
    if (activeTab === "deleted"  && isAdmin) loadDeleted();
    if (activeTab === "log"      && isAdmin) loadLog();
  }, [activeTab, isAdmin]);

  /* ── actions ── */
  const doAction = async () => {
    setActionLoading(true);
    try {
      const { type, company } = modal;
      if (type === "delete") {
        await api(`/company/${company._id}`, { method: "DELETE" });
        showToast(`"${company.name}" moved to trash`, "warn");
        loadActive();
        if (activeTab === "deleted") loadDeleted();
      } else if (type === "restore") {
        await api(`/company/${company._id}/restore`, { method: "PUT" });
        showToast(`"${company.name}" restored successfully! 🎉`, "success");
        loadDeleted();
        loadActive();
      } else if (type === "permanent") {
        const res = await api(`/company/${company._id}/permanent`, { method: "DELETE" });
        showToast(res.message || `"${company.name}" permanently deleted`, "error");
        loadDeleted();
        if (activeTab === "log") loadLog();
      }
      setModal(null);
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── skeleton ── */
  const SkeletonCard = () => (
    <div className="company-card skeleton-card">
      <div className="company-card-header">
        <div className="cp-skel cp-skel-avatar" />
        <div style={{ flex:1 }}>
          <div className="cp-skel" style={{ width:"55%", height:15, marginBottom:8 }} />
          <div className="cp-skel" style={{ width:"28%", height:11 }} />
        </div>
      </div>
      <div className="company-card-body">
        {[1,2,3].map(r => (
          <div className="cc-row" key={r}>
            <div className="cp-skel cp-skel-icon" />
            <div style={{ flex:1 }}>
              <div className="cp-skel" style={{ width:"32%", height:10, marginBottom:5 }} />
              <div className="cp-skel" style={{ width:"60%", height:13 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── RENDER ── */
  return (
    <div className="company-dir-page">

      {/* Toast */}
      {toast && (
        <div className={`cp-toast cp-toast-${toast.type}`} onClick={() => setToast(null)}>
          {toast.type === "success" ? "✅" : toast.type === "warn" ? "🗑️" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="company-dir-header">
        <div className="company-dir-icon"><Building2 size={26} /></div>
        <div>
          <h1>Company Directory</h1>
          <p>
            {companies.length > 0
              ? `${companies.length} active organization${companies.length !== 1 ? "s" : ""} on the platform`
              : "No active companies registered"}
          </p>
        </div>
      </div>

      {/* Tabs — admin only sees Trash + Log */}
      <div className="company-dir-tabs">
        <button className={`company-dir-tab ${activeTab==="active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
          🏢 Active <span className="company-tab-count">{companies.length}</span>
        </button>
        {isAdmin && (
          <button className={`company-dir-tab danger ${activeTab==="deleted" ? "active" : ""}`} onClick={() => setActiveTab("deleted")}>
            🗑️ Trash
            {deletedList.length > 0 && <span className="company-tab-count danger">{deletedList.length}</span>}
          </button>
        )}
        {isAdmin && (
          <button className={`company-dir-tab log ${activeTab==="log" ? "active" : ""}`} onClick={() => setActiveTab("log")}>
            <ClipboardList size={14} /> Deleted Log
            {deletedLog.length > 0 && <span className="company-tab-count log">{deletedLog.length}</span>}
          </button>
        )}
      </div>

      {/* ══════════ ACTIVE TAB ══════════ */}
      {activeTab === "active" && (
        <div className="company-dir-grid">
          {loading
            ? [1,2,3].map(k => <SkeletonCard key={k} />)
            : companies.length === 0
              ? <div className="company-dir-empty"><div className="empty-icon">🏢</div><h3>No companies yet</h3><p>Companies appear here once registered.</p></div>
              : companies.map(c => (
                  <ActiveCard key={c._id} company={c} isAdmin={isAdmin}
                    onDelete={() => setModal({ type:"delete", company:c })}
                  />
                ))
          }
        </div>
      )}

      {/* ══════════ TRASH TAB ══════════ */}
      {activeTab === "deleted" && isAdmin && (
        <>
          <div className="company-trash-banner">
            <AlertTriangle size={16} />
            <span>
              Companies here are soft-deleted — staff deactivated, projects &amp; tasks hidden.{" "}
              <strong>Restore</strong> to recover everything, or <strong>Delete Forever</strong> to permanently wipe all data.
            </span>
          </div>
          <div className="company-dir-grid">
            {deletedLoading
              ? [1,2].map(k => <SkeletonCard key={k} />)
              : deletedList.length === 0
                ? <div className="company-dir-empty"><div className="empty-icon">🗑️</div><h3>Trash is empty</h3><p>Deleted companies appear here.</p></div>
                : deletedList.map(c => (
                    <DeletedCard key={c._id} company={c}
                      onRestore={() => setModal({ type:"restore",   company:c })}
                      onPermanent={() => setModal({ type:"permanent", company:c })}
                    />
                  ))
            }
          </div>
        </>
      )}

      {/* ══════════ DELETED LOG TAB ══════════ */}
      {activeTab === "log" && isAdmin && (
        <>
          <div className="deleted-log-banner">
            <ClipboardList size={15} />
            <span>
              Permanent deletion audit trail — companies listed here have been <strong>wiped forever</strong> and cannot be recovered.
            </span>
          </div>

          {logLoading ? (
            <div className="log-loading"><div className="cp-log-spinner" /> Loading audit log…</div>
          ) : deletedLog.length === 0 ? (
            <div className="company-dir-empty" style={{ gridColumn:"1/-1" }}>
              <div className="empty-icon">📋</div>
              <h3>No permanent deletions yet</h3>
              <p>When a company is permanently deleted, a record appears here.</p>
            </div>
          ) : (
            <div className="deleted-log-table-wrap">
              <table className="deleted-log-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Company</th>
                    <th>Created On</th>
                    <th>Data Wiped</th>
                    <th>Deleted By</th>
                    <th>Permanently Deleted On</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedLog.map((log, i) => <LogRow key={log._id} log={log} index={i} />)}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════ CONFIRM MODAL ══════════ */}
      {modal && (
        <ConfirmModal
          type={modal.type}
          company={modal.company}
          onConfirm={doAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}