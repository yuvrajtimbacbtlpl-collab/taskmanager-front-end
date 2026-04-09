// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "/src/styles/Login.css";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: form });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span className="auth-brand-name">Task Manager</span>
        </div>

        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to your workspace</p>
        </div>

        {error && (
          <div className="server-error-box">
            <AlertCircle size={18} className="error-icon" />
            {error}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" required placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email" />
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <div className="pass-input-wrap">
              <input type={showPass ? "text" : "password"} required placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password" />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? (
                  <EyeOff size={18} className="pass-toggle-icon" />
                ) : (
                  <Eye size={18} className="pass-toggle-icon" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primaryy" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Signing in…
              </span>
            ) : (
              <span className="btn-content">
                Sign In <ArrowRight size={18} className="btn-icon" />
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          No account? <Link to="/register-company">Register your company</Link>
        </div>
      </div>
    </div>
  );
}