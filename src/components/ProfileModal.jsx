// src/components/ProfileModal.jsx — Task Manager profile (project-relevant fields only)
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  X, Camera, User, Mail, Phone, Briefcase,
  Lock, Eye, EyeOff, Save, Trash2,
  CheckCircle, AlertCircle, Building2,
  Calendar, Edit3, Shield, Users,
} from "lucide-react";
import "./ProfileModal.css";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

/* ── helpers ── */
const pwStr = (pw) => {
  let s = 0;
  if (pw.length >= 8)       s++;
  if (/[A-Z]/.test(pw))     s++;
  if (/[0-9]/.test(pw))     s++;
  if (/[@$!%*?&]/.test(pw)) s++;
  return s;
};
const STR_COLOR = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"];
const STR_LABEL = ["", "Weak",    "Fair",    "Good",    "Strong"];

const getAvatarSrc = (img) => {
  if (!img) return null;
  return img.startsWith("http") ? img : `${BASE_URL}/${img}`;
};

/* ── Inline toast ── */
function InlineToast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const styles = {
    success: { bg:"#f0fdf4", border:"#bbf7d0", color:"#15803d", icon:<CheckCircle size={15}/> },
    error:   { bg:"#fef2f2", border:"#fecaca", color:"#b91c1c", icon:<AlertCircle  size={15}/> },
  };
  const s = styles[type] || styles.success;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"10px 14px", background:s.bg, border:`1px solid ${s.border}`,
      borderRadius:9, fontSize:13, color:s.color, fontWeight:500, marginBottom:16,
    }}>
      {s.icon} {msg}
      <button onClick={onClose} style={{
        marginLeft:"auto", background:"none", border:"none",
        cursor:"pointer", color:"inherit", fontSize:18, lineHeight:1, opacity:.5,
      }}>×</button>
    </div>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function ProfileModal({ onClose }) {
  const { user, loadUser } = useAuth();
  const fileRef = useRef();

  const [tab,     setTab]     = useState("profile");
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState({ msg:"", type:"success" });
  const showToast = (msg, type="success") => setToast({ msg, type });

  /* ── profile form — only project-relevant fields ── */
  const [form, setForm] = useState({
    username:   user?.username   || "",
    phone:      user?.phone      || "",
    jobTitle:   user?.jobTitle   || "",
    department: user?.department || "",
    bio:        user?.bio        || "",
  });

  /* ── avatar ── */
  const [previewImg,      setPreviewImg]      = useState(getAvatarSrc(user?.image) || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setPreviewImg(getAvatarSrc(user?.image) || null);
  }, [user?.image]);

  /* ── password ── */
  const [pwForm,  setPwForm]  = useState({ current:"", next:"", confirm:"" });
  const [showPw,  setShowPw]  = useState({ current:false, next:false, confirm:false });

  /* ESC to close */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  /* ── avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5 MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImg(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await api("/users/profile/avatar", { method:"POST", body: fd });
      await loadUser();
      showToast("Profile photo updated!");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
      setPreviewImg(getAvatarSrc(user?.image) || null);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const removeAvatar = async () => {
    try {
      await api("/users/profile/avatar", { method:"DELETE" });
      setPreviewImg(null);
      await loadUser();
      showToast("Profile photo removed");
    } catch (err) {
      showToast(err.message || "Failed to remove", "error");
    }
  };

  /* ── save profile ── */
  const saveProfile = async () => {
    if (!form.username.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      await api("/users/profile/update", { method:"PUT", body: form });
      await loadUser();
      showToast("Profile saved successfully!");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── change password ── */
  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      showToast("Fill in all password fields", "error"); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      showToast("New passwords don't match", "error"); return;
    }
    if (pwStr(pwForm.next) < 3) {
      showToast("Password is too weak — use uppercase, number & symbol", "error"); return;
    }
    setSaving(true);
    try {
      await api("/users/profile/change-password", {
        method:"PUT",
        body:{ currentPassword: pwForm.current, newPassword: pwForm.next },
      });
      setPwForm({ current:"", next:"", confirm:"" });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── derived display values ── */
  const initials    = (user?.username || "U").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const roleName    = user?.role || "Member";
  const companyName = user?.company?.name || user?.company || "";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
    : "—";
  const strength = pwStr(pwForm.next);

  /* ── RENDER ── */
  return createPortal(
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ════ LEFT SIDEBAR ════ */}
        <div className="pm-sidebar">

          {/* Avatar */}
          <div className="pm-avatar-section">
            <div className="pm-avatar-wrap">
              {previewImg
                ? <img src={previewImg} alt="avatar" className="pm-avatar-img"/>
                : <div className="pm-avatar-initials">{initials}</div>}
              {uploadingAvatar && (
                <div className="pm-avatar-uploading"><div className="pm-avatar-spinner"/></div>
              )}
              <button className="pm-avatar-camera" onClick={() => fileRef.current?.click()} title="Change photo">
                <Camera size={13}/>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarChange}/>
            {previewImg && (
              <button className="pm-remove-photo" onClick={removeAvatar}>
                <Trash2 size={11}/> Remove
              </button>
            )}
          </div>

          {/* Name + role */}
          <div className="pm-sidebar-info">
            <h3 className="pm-sidebar-name">{user?.username}</h3>
            {form.jobTitle && <p className="pm-sidebar-jobtitle">{form.jobTitle}</p>}
            <span className="pm-sidebar-badge"><Shield size={11}/> {roleName}</span>
          </div>

          {/* Meta */}
          <div className="pm-sidebar-meta">
            {user?.email && (
              <div className="pm-meta-row"><Mail size={12}/><span>{user.email}</span></div>
            )}
            {companyName && (
              <div className="pm-meta-row"><Building2 size={12}/><span>{companyName}</span></div>
            )}
            {form.department && (
              <div className="pm-meta-row"><Users size={12}/><span>{form.department}</span></div>
            )}
            <div className="pm-meta-row"><Calendar size={12}/><span>Joined {memberSince}</span></div>
          </div>

          {/* Tab nav */}
          <nav className="pm-nav">
            <button className={`pm-nav-btn${tab==="profile" ? " active" : ""}`} onClick={() => setTab("profile")}>
              <User size={14}/> My Profile
            </button>
            <button className={`pm-nav-btn${tab==="security" ? " active" : ""}`} onClick={() => setTab("security")}>
              <Lock size={14}/> Change Password
            </button>
          </nav>
        </div>

        {/* ════ RIGHT CONTENT ════ */}
        <div className="pm-content">
          <div className="pm-content-header">
            <div>
              <h2 className="pm-content-title">
                {tab === "profile" ? "Edit Profile" : "Change Password"}
              </h2>
              <p className="pm-content-sub">
                {tab === "profile"
                  ? "Update your name, contact and work details"
                  : "Keep your account secure with a strong password"}
              </p>
            </div>
            <button className="pm-close" onClick={onClose}><X size={16}/></button>
          </div>

          <div className="pm-content-body">
            <InlineToast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:"" })}/>

            {/* ══ PROFILE TAB ══ */}
            {tab === "profile" && (
              <>
                {/* Account info (read-only) */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Account</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><Mail size={11}/> Email Address</label>
                      <input value={user?.email || ""} disabled/>
                      <span className="pm-field-hint">Contact admin to change your email</span>
                    </div>
                    <div className="pm-field">
                      <label><Shield size={11}/> Role</label>
                      <input value={roleName} disabled/>
                    </div>
                    {companyName && (
                      <div className="pm-field">
                        <label><Building2 size={11}/> Company</label>
                        <input value={companyName} disabled/>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal info */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Personal Details</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><User size={11}/> Full Name <span className="pm-required">*</span></label>
                      <input
                        value={form.username}
                        onChange={e => setForm({...form, username: e.target.value})}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="pm-field">
                      <label><Phone size={11}/> Phone Number</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                {/* Work info */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Work Details</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><Briefcase size={11}/> Job Title</label>
                      <input
                        value={form.jobTitle}
                        onChange={e => setForm({...form, jobTitle: e.target.value})}
                        placeholder="e.g. Frontend Developer"
                      />
                    </div>
                    <div className="pm-field">
                      <label><Users size={11}/> Department</label>
                      <input
                        value={form.department}
                        onChange={e => setForm({...form, department: e.target.value})}
                        placeholder="e.g. Engineering"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="pm-section">
                  <h4 className="pm-section-title">About Me</h4>
                  <div className="pm-field">
                    <label><Edit3 size={11}/> Short Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm({...form, bio: e.target.value.slice(0, 200)})}
                      placeholder="Write a short bio about yourself…"
                      rows={3}
                    />
                    <span className="pm-field-hint">{form.bio.length}/200 characters</span>
                  </div>
                </div>

                <div className="pm-footer">
                  <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
                  <button className="pm-btn-save" onClick={saveProfile} disabled={saving}>
                    {saving
                      ? <><span className="pm-spinner"/> Saving…</>
                      : <><Save size={13}/> Save Changes</>}
                  </button>
                </div>
              </>
            )}

            {/* ══ SECURITY TAB ══ */}
            {tab === "security" && (
              <>
                <div className="pm-section">
                  <h4 className="pm-section-title">Password</h4>
                  <div className="pm-security-note">
                    🔒 Minimum 8 characters with at least one uppercase letter, number and symbol (@$!%*?&)
                  </div>

                  <div className="pm-field" style={{ marginBottom:14 }}>
                    <label><Lock size={11}/> Current Password</label>
                    <div className="pm-pass-wrap">
                      <input
                        type={showPw.current ? "text" : "password"}
                        value={pwForm.current}
                        onChange={e => setPwForm({...pwForm, current: e.target.value})}
                        placeholder="Enter current password"
                      />
                      <button type="button" className="pm-eye"
                        onClick={() => setShowPw({...showPw, current:!showPw.current})}>
                        {showPw.current ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </div>

                  <div className="pm-field" style={{ marginBottom:14 }}>
                    <label><Lock size={11}/> New Password</label>
                    <div className="pm-pass-wrap">
                      <input
                        type={showPw.next ? "text" : "password"}
                        value={pwForm.next}
                        onChange={e => setPwForm({...pwForm, next: e.target.value})}
                        placeholder="Create a new password"
                      />
                      <button type="button" className="pm-eye"
                        onClick={() => setShowPw({...showPw, next:!showPw.next})}>
                        {showPw.next ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                    {pwForm.next && (
                      <div className="pm-strength">
                        <div className="pm-strength-bars">
                          {[1,2,3,4].map(n => (
                            <div key={n} className={`pm-strength-bar${strength>=n?" active":""}`}
                              style={{ background: strength>=n ? STR_COLOR[strength] : undefined }}/>
                          ))}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:STR_COLOR[strength] }}>
                          {STR_LABEL[strength]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pm-field">
                    <label><Lock size={11}/> Confirm New Password</label>
                    <div className="pm-pass-wrap">
                      <input
                        type={showPw.confirm ? "text" : "password"}
                        value={pwForm.confirm}
                        onChange={e => setPwForm({...pwForm, confirm: e.target.value})}
                        placeholder="Re-enter new password"
                      />
                      <button type="button" className="pm-eye"
                        onClick={() => setShowPw({...showPw, confirm:!showPw.confirm})}>
                        {showPw.confirm ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                    {pwForm.confirm && pwForm.next && (
                      <span style={{
                        fontSize:12, fontWeight:600, marginTop:5, display:"block",
                        color: pwForm.next===pwForm.confirm ? "#16a34a" : "#ef4444",
                      }}>
                        {pwForm.next===pwForm.confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pm-footer">
                  <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
                  <button className="pm-btn-save" onClick={changePassword} disabled={saving}>
                    {saving
                      ? <><span className="pm-spinner"/> Updating…</>
                      : <><Lock size={13}/> Update Password</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
