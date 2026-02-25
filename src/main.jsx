import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./styles/dashboard.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext"; // ✅ import

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ProjectProvider> {/* ✅ wrap here */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </ProjectProvider>
  </AuthProvider>
);