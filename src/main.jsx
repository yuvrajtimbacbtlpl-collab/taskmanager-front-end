// src/main.jsx  — UPDATED (dark mode added)
// Changes from original:
//   1. Added import for dark-mode.css (last, so it overrides correctly)
//   2. Wrapped app in <ThemeProvider>
//   Everything else is identical to your original.

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
// 4. ✅ NEW — Dark mode overrides (must be last so it wins specificity)
import "./styles/dark-mode.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { GlobalSocketProvider } from "./context/GlobalSocketProvider";
// ✅ NEW
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  // ✅ ThemeProvider wraps everything so useTheme() works anywhere
  <ThemeProvider>
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
  </ThemeProvider>
);