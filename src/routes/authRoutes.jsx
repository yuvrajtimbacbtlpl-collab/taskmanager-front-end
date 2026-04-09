import { Navigate, Outlet } from "react-router-dom";

export default function AuthRoute({ user, allow }) {
  if (!user) return <Navigate to="/login" />;

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
}
