import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const DAY_LABELS = [
  { key: "monday",    short: "Mon" },
  { key: "tuesday",   short: "Tue" },
  { key: "wednesday", short: "Wed" },
  { key: "thursday",  short: "Thu" },
  { key: "friday",    short: "Fri" },
  { key: "saturday",  short: "Sat" },
  { key: "sunday",    short: "Sun" },
];

const DEFAULT_HOURS = DAY_LABELS.map(({ key }) => ({
  day: key,
  isWorking: !["saturday", "sunday"].includes(key),
  startTime: "09:00",
  endTime: "18:00",
  breaks: !["saturday", "sunday"].includes(key)
    ? [{ name: "Lunch", startTime: "13:00", endTime: "14:00" }]
    : [],
}));

const QUICK_PRESETS = [
  { label: "Mon-Fri",    apply: (p) => p.map((d) => ({ ...d, isWorking: !["saturday","sunday"].includes(d.day) })) },
  { label: "Mon-Sat",   apply: (p) => p.map((d) => ({ ...d, isWorking: d.day !== "sunday" })) },
  { label: "All 7 Days", apply: (p) => p.map((d) => ({ ...d, isWorking: true })) },
];

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ap}`;
}

const RegisterCompany = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bulkStart, setBulkStart] = useState("09:00");
  const [bulkEnd,   setBulkEnd]   = useState("18:00");
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', companyName: '', phone: '', address: '',
  });
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);

  const checkPass = {
    len: formData.password.length >= 8,
    num: /[0-9]/.test(formData.password),
    sym: /[!@#$%^&*]/.test(formData.password),
  };
  const allPassOk = checkPass.len && checkPass.num && checkPass.sym;

  const updateDay = (i, field, value) =>
    setWorkingHours((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allPassOk) return alert("Please fulfill password requirements");
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      await axios.post(`${API_BASE}/company/public-register`, { ...formData, workingHours });
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 16px', marginBottom:'10px' };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        {/* progress bar */}
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'20px' }}>
          {[1,2].map(s => (
            <div key={s} style={{ width:'36px', height:'4px', borderRadius:'2px',
              background: s <= step ? '#2563eb' : '#e5e7eb', transition:'background .3s' }} />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="auth-header"><h2>Create Workspace</h2><p>Onboard your company and set up admin access</p></div>
              <div className="form-grid">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Owner Full Name</label>
                    <input type="text" required placeholder="John Doe"
                      onChange={e => setFormData({ ...formData, username: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Work Email</label>
                    <input type="email" required placeholder="john@company.com"
                      onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Set Password</label>
                    <input type="password" required placeholder="••••••••"
                      onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    <div className="pass-strength">
                      <div className={checkPass.len ? 'active' : ''}></div>
                      <div className={checkPass.num ? 'active' : ''}></div>
                      <div className={checkPass.sym ? 'active' : ''}></div>
                    </div>
                    <div style={{ fontSize:'11px', marginTop:'4px', lineHeight:'1.8' }}>
                      <span style={{ color: checkPass.len ? '#22c55e':'#ccc', marginRight:'8px' }}>✓ 8+ chars</span>
                      <span style={{ color: checkPass.num ? '#22c55e':'#ccc', marginRight:'8px' }}>✓ Number</span>
                      <span style={{ color: checkPass.sym ? '#22c55e':'#ccc' }}>✓ Symbol</span>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Company Legal Name</label>
                    <input type="text" required placeholder="Acme Corp"
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone <span style={{ color:'#aaa', fontWeight:400 }}>(optional)</span></label>
                  <input type="tel" placeholder="+91 98765 43210"
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Office Address</label>
                  <textarea rows="2" placeholder="Street, City, Country"
                    onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <button type="button" className="btn-primaryy"
                  disabled={!formData.username || !formData.email || !formData.companyName || !allPassOk}
                  onClick={() => setStep(2)}>
                  Next: Set Working Hours →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="auth-header">
                <h2>🕐 Company Working Hours</h2>
                <p>Configure which days your team works and the office timings. This is used to calculate smart task due dates.</p>
              </div>

              {/* Quick presets */}
              <div style={{ marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'12px', color:'#888' }}>Quick:</span>
                {QUICK_PRESETS.map(p => (
                  <button key={p.label} type="button"
                    onClick={() => setWorkingHours(prev => p.apply(prev))}
                    style={{ fontSize:'12px', padding:'4px 12px', border:'1px solid #d1d5db',
                      borderRadius:'20px', background:'#f9fafb', cursor:'pointer', color:'#374151' }}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Bulk time setter */}
              <div style={{ ...card, background:'#f0f9ff', borderColor:'#bae6fd',
                display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'14px' }}>
                <span style={{ fontSize:'12px', color:'#0369a1', fontWeight:600 }}>Apply time to all working days:</span>
                <input type="time" value={bulkStart} onChange={e => setBulkStart(e.target.value)}
                  style={{ fontSize:'13px', border:'1px solid #bae6fd', borderRadius:'6px', padding:'4px 8px' }} />
                <span style={{ fontSize:'12px', color:'#555' }}>to</span>
                <input type="time" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)}
                  style={{ fontSize:'13px', border:'1px solid #bae6fd', borderRadius:'6px', padding:'4px 8px' }} />
                <button type="button"
                  onClick={() => setWorkingHours(prev => prev.map(d => d.isWorking ? { ...d, startTime: bulkStart, endTime: bulkEnd } : d))}
                  style={{ fontSize:'12px', padding:'4px 14px', background:'#0369a1', color:'#fff',
                    border:'none', borderRadius:'6px', cursor:'pointer' }}>Apply</button>
              </div>

              {/* Day rows */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
                {workingHours.map((day, i) => {
                  const lbl = DAY_LABELS.find(d => d.key === day.day);
                  const [sh, sm] = day.startTime.split(':').map(Number);
                  const [eh, em] = day.endTime.split(':').map(Number);
                  const hrs = ((eh*60+em)-(sh*60+sm))/60;
                  return (
                    <div key={day.day} style={{
                      display:'grid', gridTemplateColumns:'80px 1fr',
                      alignItems:'center', gap:'12px', padding:'10px 14px',
                      borderRadius:'8px',
                      border:`1px solid ${day.isWorking ? '#d1fae5':'#f3f4f6'}`,
                      background: day.isWorking ? '#f0fdf4':'#fafafa',
                      transition:'all .2s',
                    }}>
                      <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', margin:0 }}>
                        <input type="checkbox" checked={day.isWorking}
                          onChange={e => updateDay(i, 'isWorking', e.target.checked)}
                          style={{ width:'16px', height:'16px', accentColor:'#22c55e' }} />
                        <span style={{ fontWeight:600, fontSize:'13px',
                          color: day.isWorking ? '#166534':'#9ca3af' }}>{lbl?.short}</span>
                      </label>

                      {day.isWorking ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                          <input type="time" value={day.startTime}
                            onChange={e => updateDay(i, 'startTime', e.target.value)}
                            style={{ fontSize:'13px', border:'1px solid #bbf7d0', borderRadius:'6px', padding:'4px 8px', background:'#fff' }} />
                          <span style={{ fontSize:'12px', color:'#6b7280' }}>–</span>
                          <input type="time" value={day.endTime}
                            onChange={e => updateDay(i, 'endTime', e.target.value)}
                            style={{ fontSize:'13px', border:'1px solid #bbf7d0', borderRadius:'6px', padding:'4px 8px', background:'#fff' }} />
                          {hrs > 0 && (
                            <span style={{ fontSize:'11px', color:'#10b981', background:'#dcfce7',
                              padding:'2px 8px', borderRadius:'10px' }}>{hrs}h</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize:'12px', color:'#9ca3af', fontStyle:'italic' }}>Day Off</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{ ...card, background:'#f8fafc', borderColor:'#e2e8f0',
                fontSize:'12px', color:'#475569', display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'16px' }}>📋</span>
                <div>
                  <strong>{workingHours.filter(d => d.isWorking).length} working days</strong>:&nbsp;
                  {workingHours.filter(d => d.isWorking).map(d => d.day.charAt(0).toUpperCase() + d.day.slice(1,3)).join(', ')}
                  &nbsp;·&nbsp;
                  {(() => { const on = workingHours.find(d => d.isWorking); return on ? `${fmt12(on.startTime)} – ${fmt12(on.endTime)}` : 'No schedule'; })()}
                  <div style={{ color:'#94a3b8', marginTop:'2px' }}>
                    Task due dates will be calculated based on these timings, skipping off-days automatically.
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}
                  style={{ flex:'0 0 auto', padding:'10px 20px' }}>← Back</button>
                <button type="submit" className="btn-primaryy" disabled={loading} style={{ flex:1 }}>
                  {loading ? "Creating Workspace..." : "Complete Registration"}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
