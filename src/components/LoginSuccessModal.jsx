export default function LoginSuccessModal({ user }) {
  return (
    <div className="success-overlay">
      <div className="success-card">
        <div className="check">✓</div>
        <h2>Login Successful</h2>
        <p>
          Welcome back, <strong>{user?.username || user?.email}</strong>
        </p>
        <p style={{ marginTop: "6px" }}>
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}
