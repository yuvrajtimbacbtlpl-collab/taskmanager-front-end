// src/routes/PermissionRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionRoute({ permission, children }) {
  const { hasPermission, user, loading } = useAuth();

  // Wait for auth to finish loading before checking permissions
  if (loading) return null; 

  if (!user) return <Navigate to="/login" replace />;

  // hasPermission automatically returns true for "ADMIN" roles
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}