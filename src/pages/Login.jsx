import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "/src/styles/Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const errs = {};

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email";
    }

    if (!form.password.trim()) {
      errs.password = "Password is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });

    setServerError("");
  };

  const submit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const data = await api("/auth/login", {
        method: "POST",
        body: form,
      });

      sessionStorage.setItem("showWelcome", "true");

      login(data);
      navigate("/dashboard");

    } catch (err) {
      let message = "Invalid email or password";

      if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }

      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* HEADER */}
        <div className="login-header">
          <h2>Welcome back</h2>
          <p className="subtitle">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* EMAIL */}
        <div className="field">
          <label>Email Address</label>
          <input
            type="text"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={errors.email ? "input-error" : ""}
            placeholder="you@example.com"
          />
          {errors.email && (
            <span className="error-text">{errors.email}</span>
          )}
        </div>

        {/* PASSWORD */}
        <div className="field">
          <label>Password</label>

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
              placeholder="Enter your password"
            />

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}

          {/* FORGOT BELOW INPUT */}
          <div className="forgot-container">
            <span
              className="forgot-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>
        </div>

        {/* SERVER ERROR */}
        {serverError && (
          <div className="server-error">{serverError}</div>
        )}

        {/* BUTTON */}
        <button
          className="login-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

      </div>

    </div>
  );
}