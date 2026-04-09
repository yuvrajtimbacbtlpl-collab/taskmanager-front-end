// src/pages/ForgotPassword.jsx
// 3-step flow: Email → OTP verification → New password
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import "/src/styles/Login.css";

/* ── password strength ── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[@$!%*?&]/.test(pw)) score++;
  return score; // 0-4
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"];

export default function ForgotPassword() {
  const navigate = useNavigate();

  // step: 1=email, 2=otp, 3=newpass, 4=done
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Resend OTP timer
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const pwStrength = getStrength(password);

  /* ── OTP input refs for auto-focus ── */
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs[i + 1].current?.focus();
    setError("");
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs[5].current?.focus();
    }
    e.preventDefault();
  };

  /* ── Step 1: Send OTP ── */
  const sendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setStep(2);
      setMsg("A 6-digit OTP has been sent to your email. Check your inbox.");
      startTimer();
    } catch (err) {
      setError(err.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setOtp(["", "", "", "", "", ""]);
      setMsg("New OTP sent to your email.");
      startTimer();
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const verifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // We just move to step 3 — actual verification happens with reset
      setStep(3);
      setMsg("");
      setError("");
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Reset password ── */
  const resetPassword = async () => {
    if (!password || !confirm) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (pwStrength < 3) {
      setError(
        "Password is too weak. Use uppercase, number & symbol (e.g. Pass@123)",
      );
      return;
    }
    const otpStr = otp.join("");
    setLoading(true);
    setError("");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email, otp: otpStr, password },
      });
      setStep(4);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      // If OTP is wrong, go back to step 2
      if (err.message?.toLowerCase().includes("otp")) {
        setStep(2);
        setOtp(["", "", "", "", "", ""]);
        setError(err.message);
      } else {
        setError(err.message || "Password reset failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Progress indicator ── */
  const steps = ["Email", "Verify OTP", "New Password"];

  return (
    <div className="auth-container">
      <div className="auth-card fp-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="auth-brand-name">Task Manager</span>
        </div>

        {/* ══ SUCCESS SCREEN ══ */}
        {step === 4 ? (
          <div className="fp-success">
            <div className="fp-success-icon">
              <CheckCircle2
                size={64}
                strokeWidth={1.5}
                className="fp-success-check"
              />
            </div>
            <h2>Password Reset!</h2>
            <p>
              Your password has been changed successfully.
              <br />
              Redirecting you to login…
            </p>
            <div className="fp-success-bar">
              <div className="fp-success-bar-fill" />
            </div>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="fp-progress">
              {steps.map((label, i) => (
                <div key={i} className="fp-step-container">
                  <div
                    className={`fp-step ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}
                  >
                    <div className="fp-step-dot">
                      {step > i + 1 ? "✓" : i + 1}
                    </div>
                  </div>
                  <span className="fp-step-label">{label}</span>
                  {i < steps.length - 1 && (
                    <div
                      className={`fp-step-line ${step > i + 1 ? "done" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="auth-header" style={{ marginBottom: 24 }}>
              <h2>
                {step === 1
                  ? "Forgot Password?"
                  : step === 2
                    ? "Verify Your Email"
                    : "Create New Password"}
              </h2>
              <p>
                {step === 1
                  ? "Enter your email and we'll send you a reset OTP"
                  : step === 2
                    ? `OTP sent to ${email}`
                    : "Choose a strong new password"}
              </p>
            </div>

            {/* ── STEP 1: Email ── */}
            {step === 1 && (
              <div className="form-grid">
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: OTP boxes ── */}
            {step === 2 && (
              <div className="form-grid">
                {msg && <div className="fp-info-msg">📧 {msg}</div>}
                <div className="input-group">
                  <label>Enter 6-Digit OTP</label>
                  <div className="otp-boxes" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`otp-box ${digit ? "filled" : ""}`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <div className="otp-resend-row">
                    {resendTimer > 0 ? (
                      <span className="otp-timer">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="otp-resend-btn"
                        onClick={resendOtp}
                        disabled={loading}
                      >
                        Didn't receive it? Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: New password ── */}
            {step === 3 && (
              <div className="form-grid">
                <div className="input-group">
                  <label>New Password</label>
                  <div className="pass-input-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, number & symbol"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowPass((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPass ? (
                        <EyeOff size={18} className="pass-toggle-icon" />
                      ) : (
                        <Eye size={18} className="pass-toggle-icon" />
                      )}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password && (
                    <div className="fp-strength-wrap">
                      <div className="pass-strength">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className={pwStrength >= n ? "active" : ""}
                            style={{
                              background:
                                pwStrength >= n
                                  ? STRENGTH_COLOR[pwStrength]
                                  : undefined,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="fp-strength-label"
                        style={{ color: STRENGTH_COLOR[pwStrength] }}
                      >
                        {STRENGTH_LABEL[pwStrength]}
                      </span>
                    </div>
                  )}
                  <p className="fp-hint">
                    Use 8-20 characters with at least one uppercase letter,
                    number, and symbol (@$!%*?&)
                  </p>
                </div>
                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="pass-input-wrap">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setError("");
                      }}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowConfirm((p) => !p)}
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff size={18} className="pass-toggle-icon" />
                      ) : (
                        <Eye size={18} className="pass-toggle-icon" />
                      )}
                    </button>
                  </div>
                  {confirm && password && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        marginTop: 4,
                        color: password === confirm ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {password === confirm
                        ? "✓ Passwords match"
                        : "✗ Passwords don't match"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="server-error-box" style={{ marginTop: 16 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="fp-actions">
              {step > 1 && (
                <button
                  className="fp-back-btn"
                  onClick={() => {
                    setStep((s) => s - 1);
                    setError("");
                    setMsg("");
                  }}
                  disabled={loading}
                >
                  ← Back
                </button>
              )}

              {step === 1 && (
                <button
                  className="btn-primaryy fp-primary-btn"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      Sending…
                    </span>
                  ) : (
                    <span className="btn-content">
                      Send OTP <ArrowRight size={18} className="btn-icon" />
                    </span>
                  )}
                </button>
              )}
              {step === 2 && (
                <button
                  className="btn-primaryy fp-primary-btn"
                  onClick={verifyOtp}
                  disabled={loading || otp.join("").length < 6}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      Verifying…
                    </span>
                  ) : (
                    <span className="btn-content">
                      Verify OTP <ArrowRight size={18} className="btn-icon" />
                    </span>
                  )}
                </button>
              )}
              {step === 3 && (
                <button
                  className="btn-primaryy fp-primary-btn"
                  onClick={resetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner" />
                      Resetting…
                    </span>
                  ) : (
                    <span className="btn-content">
                      Reset Password{" "}
                      <CheckCircle2 size={18} className="btn-icon" />
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="auth-footer">
              Remembered it? <Link to="/login">Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
