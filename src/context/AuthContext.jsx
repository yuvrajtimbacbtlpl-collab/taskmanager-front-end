import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";
import socket from "../socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [company, setCompany] = useState(null); // ✅ NEW - Company data
  const [loading, setLoading] = useState(true);

  /* ================= NORMALIZE PERMISSIONS ================= */
  const normalizePermissions = (perms = []) =>
    perms.map((p) => (typeof p === "string" ? p : p.name));

  /* ================= LOAD CURRENT USER ================= */
  const loadUser = async () => {
    try {
      const data = await api("/auth/me").catch(() => null);

      if (!data) {
        setUser(null);
        setRole(null);
        setPermissions([]);
        setCompany(null); // ✅ RESET COMPANY
        return;
      }

      // ✅ Proper extraction from your updated Backend structure
      const roleData = data.role;
      const roleName = roleData?.name?.toUpperCase() || null;
      const perms = normalizePermissions(roleData?.permissions || []);

      setUser({
        _id: data._id,
        username: data.username,
        email: data.email,
        role: roleName,
        company: data.company, // ✅ STORE COMPANY ID
      });

      // ✅ SET COMPANY DATA
      setCompany(data.company);

      setRole(roleName);
      setPermissions(perms);

      if (data._id && !socket.connected) {
        socket.connect();
        socket.emit("joinUser", data._id);
      }
    } catch (err) {
      console.error("Auth loadUser error:", err);
      setUser(null);
      setRole(null);
      setPermissions([]);
      setCompany(null); // ✅ RESET COMPANY
    }
  };

  useEffect(() => {
    loadUser().finally(() => setLoading(false));

    // Realtime updates
    socket.on("staffUpdated", loadUser);
    socket.on("roleUpdated", loadUser);

    // Listen for document-related notifications
    const handleDocRequest = (payload) => {
      try {
        const title = payload?.documentTitle || "Document Request";
        const requester =
          payload?.requesterName || payload?.requesterEmail || "Someone";
        alert(`${requester} requested access to "${title}"`);
        console.log("Document notification:", payload);
      } catch (err) {
        console.error("Notification handler error:", err);
      }
    };

    socket.on("documentAccessRequested", handleDocRequest);

    return () => {
      socket.off("staffUpdated", loadUser);
      socket.off("roleUpdated", loadUser);
      socket.off("documentAccessRequested", handleDocRequest);
    };
  }, []);

  /* ================= LOGIN ================= */
  const login = (data) => {
    // ✅ Use the same structure as loadUser
    const roleData = data.role;
    const roleName = roleData?.name?.toUpperCase() || null;
    const perms = normalizePermissions(roleData?.permissions || []);

    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      role: roleName,
      company: data.company, // ✅ STORE COMPANY ID
    });

    // ✅ SET COMPANY DATA
    setCompany(data.company);

    setRole(roleName);
    setPermissions(perms);

    if (data._id && !socket.connected) {
      socket.connect();
      socket.emit("joinUser", data._id);
    }

    loadUser(); // Refresh to ensure backend sync
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }

    socket.disconnect();
    setUser(null);
    setRole(null);
    setPermissions([]);
    setCompany(null); // ✅ RESET COMPANY
  };

  /* ================= PERMISSION CHECK ================= */
  const hasPermission = (requiredPermission) => {
    if (!role) return false;
    if (role.toUpperCase() === "ADMIN") return true;
    return permissions.includes(requiredPermission);
  };

  /* ================= FEATURE CHECK ================= */
  const hasFeatureAccess = (feature) => {
    if (!role) return false;
    if (role.toUpperCase() === "ADMIN") return true;
    return permissions.some((perm) => perm.startsWith(`${feature}.`));
  };

  /* ================= AUTHENTICATION HELPER ================= */
  const isAuthenticated = () => !!user;

  // ✅ GET CURRENT COMPANY ID
  const getCurrentCompanyId = () => user?.company || company?._id;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        company,
        loading,
        login,
        logout,
        hasPermission,
        hasFeatureAccess,
        isAuthenticated,
        getCurrentCompanyId, // ✅ NEW HELPER
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);