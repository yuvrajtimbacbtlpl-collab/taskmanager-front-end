import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";
import socket from "../socket"; // ✅ add

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizePermissions = (perms = []) => {
    return perms.map((p) => (typeof p === "string" ? p : p.name));
  };

  const loadUser = async () => {
    try {
      const data = await api("/auth/me");

      if (!data) {
        setUser(null);
        setRole(null);
        setPermissions([]);
        return;
      }

      const roleName = data.role?.name || null;
      const perms = normalizePermissions(data.role?.permissions || []);

      setUser({
        username: data.username,
        email: data.email,
        role: roleName,
      });

      setRole(roleName);
      setPermissions(perms);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUser().finally(() => setLoading(false));

    // ✅ REALTIME ROLE / PERMISSION UPDATE
    socket.on("staffUpdated", () => {
      console.log("Realtime role update received");
      loadUser();
    });

    socket.on("roleUpdated", () => {
      console.log("Realtime permission update received");
      loadUser();
    });

    return () => {
      socket.off("staffUpdated");
      socket.off("roleUpdated");
    };
  }, []);

  const login = (data) => {
    const roleName = data.role?.name || data.role || null;
    const perms = normalizePermissions(data.role?.permissions || []);

    setUser({
      username: data.username,
      email: data.email,
      role: roleName,
    });

    setRole(roleName);
    setPermissions(perms);

    socket.connect();

    loadUser(); // ✅ add this line
  };

  const logout = async () => {
    await api("/auth/logout", { method: "POST" });

    socket.disconnect(); // ✅ important

    setUser(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = (requiredPermission) => {
    if (!role) return false;
    if (role.toUpperCase() === "ADMIN") return true;
    return permissions.includes(requiredPermission);
  };

  const hasFeatureAccess = (feature) => {
    if (!role) return false;
    if (role.toUpperCase() === "ADMIN") return true;
    return permissions.some((perm) => perm.startsWith(`${feature}.`));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        loading,
        login,
        logout,
        hasPermission,
        hasFeatureAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
