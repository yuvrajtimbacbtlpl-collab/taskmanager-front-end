import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function Dashboard({ role, user, onLogout }) {
  return (
    <div className="dashboard">
      <Sidebar role={role} />

      <div className="main">
        <Header role={role} user={user} onLogout={onLogout} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
