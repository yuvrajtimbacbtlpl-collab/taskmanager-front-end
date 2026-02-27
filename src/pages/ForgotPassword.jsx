import { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirm: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMsg("");
  };

  // SEND OTP
  const sendOtp = async () => {
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      setLoading(true);
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: form.email },
      });

      setStep(2);
      setMsg("OTP sent to your email");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async () => {
    if (!form.otp.trim() || !form.password.trim() || !form.confirm.trim()) {
      setError("All fields are required");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await api("/auth/reset-password", {
        method: "POST",
        body: {
          email: form.email,
          otp: form.otp,
          password: form.password,
        },
      });

      alert("Password reset successful");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Reset Password</h2>
          <p className="subtitle">Recover your account securely</p>
        </div>

        {/* STEP 1: SEND OTP */}
        {step === 1 && (
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        )}

        {/* STEP 2: RESET PASSWORD */}
        {step === 2 && (
          <>
            <div className="field">
              <label>OTP</label>
              <input
                name="otp"
                placeholder="Enter OTP"
                value={form.otp}
                onChange={handleChange}
              />
            </div>

            <div className="field password-wrapper">
              <label>New Password</label>
              <input
                type="password"
                name="password"
                placeholder="New Password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="field password-wrapper">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirm"
                placeholder="Confirm Password"
                value={form.confirm}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {/* MESSAGES */}
        {msg && <p style={{ color: "green", marginBottom: "10px" }}>{msg}</p>}
        {error && <div className="server-error">{error}</div>}

        {/* BUTTONS */}
        {/* BUTTONS */}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button
            className="login-btn"
            style={{
              flex: 1,
              background: "#e0e0e0",
              color: "#333",
              boxShadow: "none",
            }}
            onClick={() => navigate("/login")}
          >
            Back
          </button>

          
          {step === 1 ? (
            <button
              className="login-btn"
              style={{ flex: 1 }}
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          ) : (
            <button
              className="login-btn"
              style={{ flex: 1 }}
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          )}

          
        </div>
      </div>
    </div>
  );
}
