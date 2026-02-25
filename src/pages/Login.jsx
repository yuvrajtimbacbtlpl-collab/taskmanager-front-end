import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

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

  // ================= VALIDATION =================
  const validate = () => {
    const errs = {};

    // EMAIL
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (form.email.length > 100) {
      errs.email = "Maximum 100 characters allowed";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email";
    }

    // PASSWORD
    if (!form.password.trim()) {
      errs.password = "Password is required";
    } else if (form.password.length > 15) {
      errs.password = "Maximum 15 characters allowed";
    } else if (form.password.length < 4) {
      errs.password = "Minimum 4 characters required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });

    setServerError("");
  };

  // ================= SUBMIT =================
  const submit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setServerError("");

      const data = await api("/auth/login", {
        method: "POST",
        body: form,
      });

      // show welcome flag
      sessionStorage.setItem("showWelcome", "true");

      login(data);

      navigate("/dashboard");
    } catch (err) {
      console.log("LOGIN ERROR:", err);

      let message = "Invalid email or password";

      // axios style error
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      }

      // fetch style error
      else if (err?.message) {
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
        <h2>Sign In</h2>
        <p className="subtitle">Enter your credentials to access dashboard</p>

        {/* EMAIL */}
        <div className="field">
          <label>Email</label>
          <input
            type="text"
            name="email"
            maxLength={100}
            value={form.email}
            onChange={handleChange}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* PASSWORD */}
        <div className="field">
          <label>Password</label>

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              maxLength={15}
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 10,
                top: 8,
                cursor: "pointer",
                fontSize: 14,
                color: "#555",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        {/* SERVER ERROR */}
        {serverError && <div className="server-error">{serverError}</div>}

        <button onClick={submit} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}
