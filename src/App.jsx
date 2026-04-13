import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useGlobalSocket } from "./context/GlobalSocketProvider";

// Remaining Pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";

// Dashboard Pages
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
import IssueManagement from "./pages/dashboard/IssueManagement";
import Documents from "./pages/dashboard/Documents";
import Chat from "./pages/dashboard/Chat";
import RegisterCompany from "./pages/RegisterCompany";
import CompanyDashboard from "./pages/dashboard/CompanyPage";

// Components
import SuccessNotificationPopup from "./components/SuccessNotificationPopup";
import DocumentRequestNotification from "./components/DocumentRequestNotification";

export default function App() {
  const { user, loading, role } = useAuth();
  const {
    socket,
    documentRequestNotification,
    setDocumentRequestNotification,
  } = useGlobalSocket();
  const [successPopup, setSuccessPopup] = React.useState(null);

  useEffect(() => {
    if (socket && role === "ADMIN") {
      socket.on("newCompanyRegistration", (data) => {
        setSuccessPopup({
          type: "success",
          title: "New Registration",
          message: data.message || "A new company has requested approval.",
        });
      });
    }
    return () => {
      if (socket) socket.off("newCompanyRegistration");
    };
  }, [socket, role]);

  const handleRequestUpdated = (status) => {
    setDocumentRequestNotification(null);
    setSuccessPopup({
      type: status === "approved" ? "success" : "rejected",
      title: status === "approved" ? "Request Approved" : "Request Rejected",
      message:
        status === "approved"
          ? "You have approved the access request."
          : "You have rejected the access request.",
    });
  };

  if (loading) {
    return (
      <div className="page-loader-center">
        <Loader text="Restoring session..." />
      </div>
    );
  }

  return (
    <>
      {documentRequestNotification && (
        <DocumentRequestNotification
          notification={documentRequestNotification}
          onClose={() => setDocumentRequestNotification(null)}
          onRequestUpdated={handleRequestUpdated}
        />
      )}

      {successPopup && (
        <SuccessNotificationPopup
          isVisible={!!successPopup}
          onClose={() => setSuccessPopup(null)}
          title={successPopup.title}
          message={successPopup.message}
          type={successPopup.type}
        />
      )}

      <Routes>
        {/* LANDING PAGE FALLBACK */}

        <Route path="/register-company" element={<RegisterCompany />} />

        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* AUTH ROUTES */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            user ? <DashboardLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<DashboardHome />} />

          <Route path="companies" element={<CompanyDashboard />} />

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


          <Route
            path="projects"
            element={
              <PermissionRoute permission="project.read">
                <Projects />
              </PermissionRoute>
            }
          />
          <Route
            path="task"
            element={
              <PermissionRoute permission="task.read">
                <CreateTask />
              </PermissionRoute>
            }
          />
          <Route
            path="issues"
            element={
              <PermissionRoute permission="issue.read">
                <IssueManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="team"
            element={
              <PermissionRoute permission="team.read">
                <Team />
              </PermissionRoute>
            }
          />

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

          <Route
            path="permissions"
            element={
              <PermissionRoute permission="permission.read">
                <PermissionManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="task-status"
            element={
              <PermissionRoute permission="taskStatus.read">
                <TaskStatus />
              </PermissionRoute>
            }
          />
          <Route
            path="documents"
            element={
              <PermissionRoute permission="document.read">
                <Documents />
              </PermissionRoute>
            }
          />
          <Route path="chat" element={<Chat />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}