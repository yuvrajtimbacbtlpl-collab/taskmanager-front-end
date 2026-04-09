// src/pages/dashboard/AdminCompanies.jsx
import { useEffect, useState, useCallback } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "/src/styles/AdminCompanies.css";

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtFull(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function getInitial(name) {
  return (name || "C").charAt(0).toUpperCase();
}

export default function AdminCompanies() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [mainTab, setMainTab] = useState("active");

  // Active companies
  const [companies, setCompanies]         = useState([]);
  const [filtered,  setFiltered]          = useState([]);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [loading, setLoading]             = useState(true);

  // Deleted companies
  const [deletedList,    setDeletedList]  = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  // Modals
  const [detailCompany,  setDetailCompany]  = useState(null);
  const [rejectTarget,   setRejectTarget]   = useState(null);
  const [rejectReason,   setRejectReason]   = useState("");
  const [softDelTarget,  setSoftDelTarget]  = useState(null);
  const [permDelTarget,  setPermDelTarget]  = useState(null);
  const [actionLoading,  setActionLoading]  = useState(false);

  useEffect(() => {
    if (role !== "ADMIN") navigate("/dashboard");
  }, [role, navigate]);

  /* ── Fetch ── */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/company/all");
      const list = Array.isArray(data) ? data : data?.companies || [];
      setCompanies(list);
      setFiltered(list);
    } catch (err) {
      console.error("Fetch error:", err);
      setCompanies([]); setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeleted = useCallback(async () => {
    setDeletedLoading(true);
    try {
      const data = await api("/company/deleted");
      setDeletedList(Array.isArray(data) ? data : []);
    } catch { setDeletedList([]); }
    finally { setDeletedLoading(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { if (mainTab === "deleted") fetchDeleted(); }, [mainTab, fetchDeleted]);

  useEffect(() => {
    if (statusFilter === "all") setFiltered(companies);
    else setFiltered(companies.filter((c) => c.status === statusFilter));
  }, [statusFilter, companies]);

  /* ── Helpers ── */
  const cName  = (c) => c.companyName  || c.name  || "—";
  const cEmail = (c) => c.companyEmail || c.email || "—";
  const ownerName = (c) => c.owner?.username || (c.owner?.firstName ? `${c.owner.firstName} ${c.owner.lastName}` : null) || "No Owner";

  const getStatusBadge = (status) => {
    if (status === 1 || status === "active")   return <span className="status-badge badge-active">Active</span>;
    if (status === 0 || status === "inactive") return <span className="status-badge badge-inactive">Inactive</span>;
    if (status === "approved") return <span className="status-badge badge-approved">Approved</span>;
    if (status === "rejected") return <span className="status-badge badge-rejected">Rejected</span>;
    if (status === "pending")  return <span className="status-badge badge-pending">Pending</span>;
    return <span className="status-badge badge-inactive">{status || "—"}</span>;
  };

  /* ── Actions ── */
  const handleApprove = async (id) => {
    try {
      await api(`/company/approve/${id}`, { method: "PUT" });
      fetchCompanies();
    } catch (err) { alert(err.message || "Failed to approve"); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a rejection reason");
    try {
      await api(`/company/${rejectTarget._id}/reject`, { method: "PUT", body: { reason: rejectReason } });
      setRejectTarget(null); setRejectReason(""); fetchCompanies();
    } catch { alert("Failed to reject company"); }
  };

  const handleSoftDelete = async () => {
    setActionLoading(true);
    try {
      const res = await api(`/company/${softDelTarget._id}`, { method: "DELETE" });
      alert(res.message || "Company moved to trash");
      setSoftDelTarget(null); fetchCompanies();
    } catch (err) { alert(err.message || "Failed to delete"); }
    finally { setActionLoading(false); }
  };

  const handleRestore = async (company) => {
    setActionLoading(true);
    try {
      const res = await api(`/company/${company._id}/restore`, { method: "PUT" });
      alert(res.message || "Company restored!");
      fetchDeleted(); fetchCompanies();
    } catch (err) { alert(err.message || "Failed to restore"); }
    finally { setActionLoading(false); }
  };

  const handlePermDelete = async () => {
    setActionLoading(true);
    try {
      const res = await api(`/company/${permDelTarget._id}/permanent`, { method: "DELETE" });
      alert(res.message || "Permanently deleted");
      setPermDelTarget(null); fetchDeleted();
    } catch (err) { alert(err.message || "Failed to permanently delete"); }
    finally { setActionLoading(false); }
  };

  const STATUS_COUNTS = {
    all:      companies.length,
    pending:  companies.filter((c) => c.status === "pending").length,
    approved: companies.filter((c) => c.status === "approved").length,
    rejected: companies.filter((c) => c.status === "rejected").length,
  };

  /* ── RENDER ── */
  return (
    <div className="admin-companies-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Company Management</h1>
          <p>Manage all registered companies and their data</p>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="main-tabs">
        <button
          className={`main-tab-btn ${mainTab === "active" ? "active" : ""}`}
          onClick={() => setMainTab("active")}
        >
          🏢 Active Companies
          <span className="tab-count-chip">{companies.length}</span>
        </button>
        <button
          className={`main-tab-btn danger ${mainTab === "deleted" ? "active" : ""}`}
          onClick={() => setMainTab("deleted")}
        >
          🗑️ Trash
          {deletedList.length > 0 && (
            <span className="tab-count-chip">{deletedList.length}</span>
          )}
        </button>
      </div>

      {/* ════════ ACTIVE COMPANIES ════════ */}
      {mainTab === "active" && (
        <>
          <div className="filter-tabs">
            {[
              { key: "all",      label: "All" },
              { key: "pending",  label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`tab ${statusFilter === key ? "active" : ""}`}
                onClick={() => setStatusFilter(key)}
              >
                {label} ({STATUS_COUNTS[key] || 0})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="companies-loading">
              <div className="loader" />
              Loading companies...
            </div>
          ) : filtered.length === 0 ? (
            <div className="companies-empty">
              <div className="empty-icon">🏢</div>
              <h3>No companies found</h3>
              <p>No company registrations match this filter.</p>
              <button className="btn-refresh" onClick={fetchCompanies}>↻ Refresh</button>
            </div>
          ) : (
            <div className="companies-table-container">
              <table className="companies-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Industry</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((company) => (
                    <tr key={company._id}>
                      <td>
                        <div className="company-name-cell">
                          <div className="company-avatar">{getInitial(cName(company))}</div>
                          <div className="company-name-text">
                            <strong>{cName(company)}</strong>
                            <span>{company.industry || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{ownerName(company)}</td>
                      <td>{cEmail(company)}</td>
                      <td>{company.industry || "—"}</td>
                      <td>{getStatusBadge(company.status)}</td>
                      <td>{fmt(company.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => setDetailCompany(company)}
                          >
                            👁 View
                          </button>
                          {company.status === "pending" && (
                            <>
                              <button className="btn-approve" onClick={() => handleApprove(company._id)}>
                                ✓ Approve
                              </button>
                              <button className="btn-reject" onClick={() => setRejectTarget(company)}>
                                ✕ Reject
                              </button>
                            </>
                          )}
                          <button className="btn-delete" onClick={() => setSoftDelTarget(company)}>
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════ DELETED COMPANIES (TRASH) ════════ */}
      {mainTab === "deleted" && (
        <>
          <div className="trash-warning-banner">
            <span className="tw-icon">⚠️</span>
            <div>
              <strong>Trash — Soft-deleted Companies</strong>
              <br />
              Companies below are soft-deleted. All their projects, tasks, issues and staff have been
              deactivated. <strong>Restore</strong> to recover everything, or{" "}
              <strong>Delete Forever</strong> to permanently wipe all data (irreversible).
            </div>
          </div>

          {deletedLoading ? (
            <div className="companies-loading">
              <div className="loader" />
              Loading deleted companies...
            </div>
          ) : deletedList.length === 0 ? (
            <div className="companies-empty">
              <div className="empty-icon">🗑️</div>
              <h3>Trash is empty</h3>
              <p>No deleted companies found.</p>
            </div>
          ) : (
            <div className="companies-table-container">
              <table className="companies-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Deleted On</th>
                    <th>Deleted By</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedList.map((company) => (
                    <tr key={company._id} className="deleted-row">
                      <td>
                        <div className="deleted-company-name">
                          🗑️ {cName(company)}
                        </div>
                      </td>
                      <td>{cEmail(company)}</td>
                      <td>{fmtFull(company.deletedAt)}</td>
                      <td>
                        {company.deletedBy?.username || company.deletedBy?.email || "Super Admin"}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: "center" }}>
                          <button
                            className="btn-restore"
                            onClick={() => handleRestore(company)}
                            disabled={actionLoading}
                          >
                            ♻️ Restore
                          </button>
                          <button
                            className="btn-perm-delete"
                            onClick={() => setPermDelTarget(company)}
                            disabled={actionLoading}
                          >
                            💥 Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ MODALS ════════════════════ */}

      {/* Detail Modal */}
      {detailCompany && (
        <div className="modal-overlay" onClick={() => setDetailCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailCompany(null)}>×</button>
            <h2>{cName(detailCompany)}</h2>
            <p>Company details and information</p>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Company Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Email</span>
                    <span>{cEmail(detailCompany)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Industry</span>
                    <span>{detailCompany.industry || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status</span>
                    <span>{getStatusBadge(detailCompany.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Registered</span>
                    <span>{fmt(detailCompany.createdAt)}</span>
                  </div>
                  {detailCompany.phone && (
                    <div className="detail-item">
                      <span className="label">Phone</span>
                      <span>{detailCompany.phone}</span>
                    </div>
                  )}
                  {detailCompany.website && (
                    <div className="detail-item">
                      <span className="label">Website</span>
                      <span>{detailCompany.website}</span>
                    </div>
                  )}
                </div>
              </div>
              {detailCompany.owner && (
                <div className="detail-section">
                  <h3>Owner Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span>{ownerName(detailCompany)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email</span>
                      <span>{detailCompany.owner?.email || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <button className="modal-close" onClick={() => setRejectTarget(null)}>×</button>
            <h2>Reject Company</h2>
            <p>Company: <strong>{cName(rejectTarget)}</strong></p>
            <div className="modal-body" style={{ paddingTop: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Reason for rejection <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                className="rejection-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a clear reason for rejecting this company registration..."
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn-reject" onClick={handleReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirm */}
      {softDelTarget && (
        <div className="modal-overlay" onClick={() => setSoftDelTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="confirm-modal-body">
              <span className="confirm-modal-icon">🗑️</span>
              <h2>Delete Company?</h2>
              <p>
                You are about to delete{" "}
                <strong>{cName(softDelTarget)}</strong>
              </p>
              <div className="confirm-effects-list soft">
                <strong>This action will:</strong>
                <ul>
                  <li>Move the company to Trash (recoverable)</li>
                  <li>Deactivate all staff accounts of this company</li>
                  <li>Hide all projects, tasks &amp; issues</li>
                  <li>Can be fully restored at any time from Trash</li>
                </ul>
              </div>
              <div className="confirm-modal-actions">
                <button className="confirm-btn-cancel" onClick={() => setSoftDelTarget(null)}>
                  Cancel
                </button>
                <button
                  className="confirm-btn-soft-delete"
                  onClick={handleSoftDelete}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <span className="btn-loading"><span className="btn-spinner" /> Deleting...</span>
                    : "🗑️ Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirm */}
      {permDelTarget && (
        <div className="modal-overlay" onClick={() => setPermDelTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="confirm-modal-body">
              <span className="confirm-modal-icon">💥</span>
              <h2 style={{ color: "#ef4444" }}>Permanently Delete?</h2>
              <p>
                Permanently delete <strong>{cName(permDelTarget)}</strong>?<br />
                <span style={{ color: "#ef4444", fontWeight: 600 }}>This cannot be undone.</span>
              </p>
              <div className="confirm-effects-list hard">
                <strong>⚠️ ALL DATA WILL BE PERMANENTLY WIPED:</strong>
                <ul>
                  <li>All projects permanently removed</li>
                  <li>All tasks &amp; issues permanently removed</li>
                  <li>All staff accounts permanently deleted</li>
                  <li>Company record gone forever</li>
                </ul>
              </div>
              <div className="confirm-modal-actions">
                <button className="confirm-btn-cancel" onClick={() => setPermDelTarget(null)}>
                  Cancel
                </button>
                <button
                  className="confirm-btn-hard-delete"
                  onClick={handlePermDelete}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <span className="btn-loading"><span className="btn-spinner" /> Deleting...</span>
                    : "💥 Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
