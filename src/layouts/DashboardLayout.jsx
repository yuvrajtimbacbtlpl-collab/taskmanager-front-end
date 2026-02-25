import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main">
        <Header user={user} onLogout={logout} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}