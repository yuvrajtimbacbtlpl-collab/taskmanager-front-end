// src/components/ProfileModal.jsx — Full industry-level profile editor
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  X, Camera, User, Mail, Phone, Briefcase, MapPin,
  Globe, Linkedin, Twitter, Lock, Eye, EyeOff,
  Save, Trash2, CheckCircle, AlertCircle, Building2,
  Calendar, Edit3, Shield,
} from "lucide-react";
import "./ProfileModal.css";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

/* ── password strength ── */
const pwStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)        s++;
  if (/[A-Z]/.test(pw))      s++;
  if (/[0-9]/.test(pw))      s++;
  if (/[@$!%*?&]/.test(pw))  s++;
  return s;
};
const STR_COLOR = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"];
const STR_LABEL = ["", "Weak", "Fair", "Good", "Strong"];

/* ── avatar URL helper ── */
const avatarUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${BASE_URL}/${img}`;
};

/* ── inline toast ── */
function InlineToast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const colors = {
    success: { bg:"#f0fdf4", border:"#bbf7d0", color:"#15803d", icon:<CheckCircle size={16}/> },
    error:   { bg:"#fef2f2", border:"#fecaca", color:"#b91c1c", icon:<AlertCircle  size={16}/> },
  };
  const c = colors[type] || colors.success;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
      background:c.bg, border:`1px solid ${c.border}`, borderRadius:9,
      fontSize:13, color:c.color, fontWeight:500, marginBottom:14 }}>
      {c.icon} {msg}
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none",
        cursor:"pointer", color:"inherit", fontSize:16, lineHeight:1, opacity:.6 }}>×</button>
    </div>
  );
}

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();

  const [tab, setTab] = useState("profile"); // profile | security
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg:"", type:"success" });
  const showToast = (msg, type="success") => setToast({ msg, type });

  /* ── profile form ── */
  const [form, setForm] = useState({
    username:   user?.username   || "",
    phone:      user?.phone      || "",
    bio:        user?.bio        || "",
    jobTitle:   user?.jobTitle   || "",
    department: user?.department || "",
    location:   user?.location   || "",
    website:    user?.website    || "",
    linkedin:   user?.linkedin   || "",
    twitter:    user?.twitter    || "",
  });

  /* ── avatar ── */
  const [previewImg, setPreviewImg] = useState(avatarUrl(user?.image) || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ── password ── */
  const [pwForm, setPwForm] = useState({ current:"", new:"", confirm:"" });
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false });

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

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImg(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api("/users/profile/avatar", { method:"POST", body: fd });
      updateUser({ image: res.imageUrl });
      showToast("Profile photo updated!");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
      setPreviewImg(avatarUrl(user?.image) || null);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const removeAvatar = async () => {
    try {
      await api("/users/profile/avatar", { method: "DELETE" });
      setPreviewImg(null);
      updateUser({ image: "" });
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
      const res = await api("/users/profile/update", { method:"PUT", body: form });
      updateUser(form);
      showToast("Profile saved successfully!");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── change password ── */
  const changePassword = async () => {
    if (!pwForm.current || !pwForm.new || !pwForm.confirm) { showToast("Fill in all password fields", "error"); return; }
    if (pwForm.new !== pwForm.confirm) { showToast("New passwords don't match", "error"); return; }
    if (pwStrength(pwForm.new) < 3) { showToast("Password is too weak", "error"); return; }
    setSaving(true);
    try {
      await api("/users/profile/change-password", { method:"PUT", body:{ currentPassword: pwForm.current, newPassword: pwForm.new } });
      setPwForm({ current:"", new:"", confirm:"" });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.username || "U").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) : "—";

  return createPortal(
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Left panel ── */}
        <div className="pm-sidebar">
          {/* Avatar */}
          <div className="pm-avatar-section">
            <div className="pm-avatar-wrap">
              {previewImg
                ? <img src={previewImg} alt="avatar" className="pm-avatar-img" />
                : <div className="pm-avatar-initials">{initials}</div>
              }
              {uploadingAvatar && (
                <div className="pm-avatar-uploading"><div className="pm-avatar-spinner"/></div>
              )}
              <button className="pm-avatar-camera" onClick={() => fileRef.current?.click()} title="Change photo">
                <Camera size={14}/>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange}/>

            {previewImg && (
              <button className="pm-remove-photo" onClick={removeAvatar} title="Remove photo">
                <Trash2 size={12}/> Remove
              </button>
            )}
          </div>

          {/* User info */}
          <div className="pm-sidebar-info">
            <h3 className="pm-sidebar-name">{user?.username}</h3>
            {form.jobTitle && <p className="pm-sidebar-role">{form.jobTitle}</p>}
            <div className="pm-sidebar-badge">
              <Shield size={11}/>
              {user?.role || "Member"}
            </div>
          </div>

          {/* Meta */}
          <div className="pm-sidebar-meta">
            {user?.email && (
              <div className="pm-meta-row"><Mail size={13}/><span>{user.email}</span></div>
            )}
            {user?.company?.name && (
              <div className="pm-meta-row"><Building2 size={13}/><span>{user.company.name}</span></div>
            )}
            <div className="pm-meta-row"><Calendar size={13}/><span>Joined {memberSince}</span></div>
          </div>

          {/* Nav tabs */}
          <nav className="pm-nav">
            <button className={`pm-nav-btn ${tab==="profile"?"active":""}`} onClick={() => setTab("profile")}>
              <User size={15}/> Profile
            </button>
            <button className={`pm-nav-btn ${tab==="security"?"active":""}`} onClick={() => setTab("security")}>
              <Lock size={15}/> Security
            </button>
          </nav>
        </div>

        {/* ── Right panel ── */}
        <div className="pm-content">
          <div className="pm-content-header">
            <div>
              <h2 className="pm-content-title">
                {tab==="profile" ? "Edit Profile" : "Security Settings"}
              </h2>
              <p className="pm-content-sub">
                {tab==="profile" ? "Update your personal information and details" : "Manage your password and account security"}
              </p>
            </div>
            <button className="pm-close" onClick={onClose}><X size={17}/></button>
          </div>

          <div className="pm-content-body">
            <InlineToast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:"" })}/>

            {/* ══ PROFILE TAB ══ */}
            {tab === "profile" && (
              <>
                {/* Basic info */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Basic Information</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><User size={12}/> Full Name *</label>
                      <input value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="Your full name"/>
                    </div>
                    <div className="pm-field">
                      <label><Mail size={12}/> Email</label>
                      <input value={user?.email || ""} disabled placeholder="Email address"/>
                      <span className="pm-field-hint">Email cannot be changed here</span>
                    </div>
                    <div className="pm-field">
                      <label><Phone size={12}/> Phone</label>
                      <input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 98765 43210"/>
                    </div>
                    <div className="pm-field">
                      <label><MapPin size={12}/> Location</label>
                      <input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="City, Country"/>
                    </div>
                  </div>
                </div>

                {/* Work info */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Work Details</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><Briefcase size={12}/> Job Title</label>
                      <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle:e.target.value})} placeholder="e.g. Frontend Developer"/>
                    </div>
                    <div className="pm-field">
                      <label><Building2 size={12}/> Department</label>
                      <input value={form.department} onChange={e => setForm({...form, department:e.target.value})} placeholder="e.g. Engineering"/>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="pm-section">
                  <h4 className="pm-section-title">About</h4>
                  <div className="pm-field">
                    <label><Edit3 size={12}/> Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm({...form, bio:e.target.value.slice(0,300)})}
                      placeholder="Write a short bio about yourself…"
                      rows={3}
                    />
                    <span className="pm-field-hint">{form.bio.length}/300 characters</span>
                  </div>
                </div>

                {/* Links */}
                <div className="pm-section">
                  <h4 className="pm-section-title">Links & Social</h4>
                  <div className="pm-grid-2">
                    <div className="pm-field">
                      <label><Globe size={12}/> Website</label>
                      <input value={form.website} onChange={e => setForm({...form, website:e.target.value})} placeholder="https://yoursite.com"/>
                    </div>
                    <div className="pm-field">
                      <label><Linkedin size={12}/> LinkedIn</label>
                      <input value={form.linkedin} onChange={e => setForm({...form, linkedin:e.target.value})} placeholder="linkedin.com/in/username"/>
                    </div>
                    <div className="pm-field">
                      <label><Twitter size={12}/> Twitter / X</label>
                      <input value={form.twitter} onChange={e => setForm({...form, twitter:e.target.value})} placeholder="@username"/>
                    </div>
                  </div>
                </div>

                <div className="pm-footer">
                  <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
                  <button className="pm-btn-save" onClick={saveProfile} disabled={saving}>
                    {saving ? <><span className="pm-spinner"/>Saving…</> : <><Save size={14}/> Save Profile</>}
                  </button>
                </div>
              </>
            )}

            {/* ══ SECURITY TAB ══ */}
            {tab === "security" && (
              <>
                <div className="pm-section">
                  <h4 className="pm-section-title">Change Password</h4>
                  <p className="pm-security-note">
                    🔒 Use a strong password with at least 8 characters, uppercase, number and symbol.
                  </p>

                  <div className="pm-field">
                    <label><Lock size={12}/> Current Password</label>
                    <div className="pm-pass-wrap">
                      <input type={showPw.current?"text":"password"}
                        value={pwForm.current}
                        onChange={e => setPwForm({...pwForm, current:e.target.value})}
                        placeholder="Enter your current password"/>
                      <button type="button" className="pm-eye" onClick={() => setShowPw({...showPw, current:!showPw.current})}>
                        {showPw.current ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </div>

                  <div className="pm-field">
                    <label><Lock size={12}/> New Password</label>
                    <div className="pm-pass-wrap">
                      <input type={showPw.new?"text":"password"}
                        value={pwForm.new}
                        onChange={e => setPwForm({...pwForm, new:e.target.value})}
                        placeholder="Create a new password"/>
                      <button type="button" className="pm-eye" onClick={() => setShowPw({...showPw, new:!showPw.new})}>
                        {showPw.new ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    {pwForm.new && (
                      <div className="pm-strength">
                        <div className="pm-strength-bars">
                          {[1,2,3,4].map(n => (
                            <div key={n} className={`pm-strength-bar ${pwStrength(pwForm.new) >= n ? "active" : ""}`}
                              style={{ background: pwStrength(pwForm.new) >= n ? STR_COLOR[pwStrength(pwForm.new)] : undefined }}/>
                          ))}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color: STR_COLOR[pwStrength(pwForm.new)] }}>
                          {STR_LABEL[pwStrength(pwForm.new)]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pm-field">
                    <label><Lock size={12}/> Confirm New Password</label>
                    <div className="pm-pass-wrap">
                      <input type={showPw.confirm?"text":"password"}
                        value={pwForm.confirm}
                        onChange={e => setPwForm({...pwForm, confirm:e.target.value})}
                        placeholder="Re-enter new password"/>
                      <button type="button" className="pm-eye" onClick={() => setShowPw({...showPw, confirm:!showPw.confirm})}>
                        {showPw.confirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    {pwForm.confirm && pwForm.new && (
                      <span style={{ fontSize:12, fontWeight:600, marginTop:4, display:"block",
                        color: pwForm.new===pwForm.confirm ? "#16a34a" : "#ef4444" }}>
                        {pwForm.new===pwForm.confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pm-footer">
                  <button className="pm-btn-cancel" onClick={onClose}>Cancel</button>
                  <button className="pm-btn-save" onClick={changePassword} disabled={saving}>
                    {saving ? <><span className="pm-spinner"/>Updating…</> : <><Lock size={14}/> Update Password</>}
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
