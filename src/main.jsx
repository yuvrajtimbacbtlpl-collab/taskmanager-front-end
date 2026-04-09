import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ── Global styles (load order matters) ──
// 1. Global reset, fonts, design tokens, shared utilities
import "./styles.css";
// 2. Dashboard layout (sidebar, topbar, shared dashboard classes)
import "./styles/dashboard.css";
// 3. Design system CSS vars (no font import — handled by styles.css)
import "./styles/design-system.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { GlobalSocketProvider } from "./context/GlobalSocketProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ProjectProvider>
      <GlobalSocketProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </GlobalSocketProvider>
    </ProjectProvider>
  </AuthProvider>
);
