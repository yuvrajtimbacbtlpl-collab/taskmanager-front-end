import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";

import DashboardHome from "./pages/dashboard/DashboardHome";
import CreateStaff from "./pages/dashboard/CreateStaff";
import CreateTask from "./pages/dashboard/CreateTask";
import StaffList from "./pages/dashboard/StaffList";
import Roles from "./pages/dashboard/Roles";
import PermissionManagement from "./pages/dashboard/PermissionManagement";
import ManageRolePermissions from "./pages/dashboard/ManageRolePermissions";
import PermissionRoute from "./routes/PermissionRoute";
import CreateRole from "./pages/dashboard/CreateRole";
import TaskStatus from "./pages/dashboard/TaskStatus";
import Loader from "./components/Loader";
import Projects from "./pages/dashboard/Projects";
import Team from "./pages/dashboard/Team";
import ForgotPassword from "./pages/ForgotPassword";
import IssueManagement from "./pages/dashboard/IssueManagement";

// ✅ New import
import Documents from "./pages/dashboard/Documents";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader-center">
        <Loader text="Restoring session..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={user ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        <Route index element={<DashboardHome />} />

        {/* ================= STAFF ================= */}
        <Route
          path="create-staff"
          element={
            <PermissionRoute permission="staff.read">
              <CreateStaff />
            </PermissionRoute>
          }
        />
        <Route
          path="staff-list"
          element={
            <PermissionRoute permission="staff.read">
              <StaffList />
            </PermissionRoute>
          }
        />

        {/* ================= Projects ================= */}
        <Route
          path="projects"
          element={
            <PermissionRoute permission="project.read">
              <Projects />
            </PermissionRoute>
          }
        />

        {/* ================= TASK ================= */}
        <Route
          path="task"
          element={
            <PermissionRoute permission="task.read">
              <CreateTask />
            </PermissionRoute>
          }
        />

        {/* ================= Issue ================= */}
        <Route
          path="issues"
          element={
            <PermissionRoute permission="issue.read">
              <IssueManagement />
            </PermissionRoute>
          }
        />

        {/* ================= Team ================= */}
        <Route
          path="team"
          element={
            <PermissionRoute permission="team.read">
              <Team />
            </PermissionRoute>
          }
        />

        {/* ================= ROLES ================= */}
        <Route
          path="roles"
          element={
            <PermissionRoute permission="role.read">
              <Roles />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/:id"
          element={
            <PermissionRoute permission="role.update">
              <ManageRolePermissions />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/create"
          element={
            <PermissionRoute permission="role.create">
              <CreateRole />
            </PermissionRoute>
          }
        />

        {/* ================= PERMISSIONS ================= */}
        <Route
          path="permissions"
          element={
            <PermissionRoute permission="permission.read">
              <PermissionManagement />
            </PermissionRoute>
          }
        />

        {/* ================= Task-Status ================= */}
        <Route
          path="task-status"
          element={
            <PermissionRoute permission="taskStatus.read">
              <TaskStatus />
            </PermissionRoute>
          }
        />

        {/* ================= DOCUMENTS ================= */}
        <Route
          path="documents"
          element={
            <PermissionRoute permission="document.read">
              <Documents />
            </PermissionRoute>
          }
        />
      </Route>

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}