import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import DashboardLayout from "../layouts/DashboardLayout";
import PermissionRoute from "./PermissionRoute";

import DashboardHome from "../pages/dashboard/DashboardHome";

import CreateTask from "../pages/tasks/CreateTask";
import AssignedTasks from "../pages/tasks/AssignedTasks";
import TaskDetails from "../pages/tasks/TaskDetails";

import CreateStaff from "../pages/staff/CreateStaff";
import StaffList from "../pages/staff/StaffList";

import RoleList from "../pages/roles/RoleList";
import EditRolePermissions from "../pages/roles/EditRolePermissions";

import PermissionManagement from "../pages/admin/PermissionManagement";

import Loader from "../components/Loader";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ✅ Better loader text logic
  const getLoadingText = () => {
    const path = location.pathname.toLowerCase();

    if (path === "/" || path === "") return "Checking session...";

    if (path.includes("login")) return "Loading login...";
    if (path.includes("tasks")) return "Loading tasks...";
    if (path.includes("staff")) return "Loading staff...";
    if (path.includes("roles")) return "Loading roles...";
    if (path.includes("permissions")) return "Loading permissions...";
    if (path.includes("dashboard")) return "Loading dashboard...";

    return "Loading...";
  };

if (loading) {
  return (
    <div className="page-loader-center">
      <Loader text="Restoring session..." />
    </div>
  );
}

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="dashboard" />} />

        <Route path="dashboard" element={<DashboardHome />} />

        <Route
          path="tasks/create"
          element={
            <PermissionRoute permission="task.create">
              <CreateTask />
            </PermissionRoute>
          }
        />

        <Route
          path="tasks/assigned"
          element={
            <PermissionRoute permission="task.read">
              <AssignedTasks />
            </PermissionRoute>
          }
        />

        <Route
          path="tasks/:id"
          element={
            <PermissionRoute permission="task.read">
              <TaskDetails />
            </PermissionRoute>
          }
        />

        <Route
          path="staff/create"
          element={
            <PermissionRoute permission="staff.create">
              <CreateStaff />
            </PermissionRoute>
          }
        />

        <Route
          path="staff/list"
          element={
            <PermissionRoute permission="staff.read">
              <StaffList />
            </PermissionRoute>
          }
        />

        <Route
          path="roles"
          element={
            <PermissionRoute permission="role.read">
              <RoleList />
            </PermissionRoute>
          }
        />

        <Route
          path="roles/:id"
          element={
            <PermissionRoute permission="role.update">
              <EditRolePermissions />
            </PermissionRoute>
          }
        />

        <Route
          path="permissions"
          element={
            <PermissionRoute permission="permission.read">
              <PermissionManagement />
            </PermissionRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;