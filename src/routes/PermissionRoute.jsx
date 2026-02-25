import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionRoute({ permission, children }) {
  const { hasPermission, user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (permission && !hasPermission(permission)) {
    return <>Access Denied!</>;
  }

  return children;
}
