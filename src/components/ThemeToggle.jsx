// src/components/ThemeToggle.jsx
// ─────────────────────────────────────────────────────────────
//  A compact Sun / Moon / System toggle that sits in your topbar.
//  Clicking cycles: light → dark → system → light
// ─────────────────────────────────────────────────────────────

import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

const MODES = ["light", "dark", "system"];
const ICONS = { light: Sun, dark: Moon, system: Monitor };
const LABELS = { light: "Light", dark: "Dark", system: "Auto" };

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const next = MODES[(MODES.indexOf(theme) + 1) % MODES.length];
    setTheme(next);
  };

  const Icon = ICONS[theme] || Sun;

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABELS[theme]} — click to change`}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
    >
      <Icon size={16} />
      <span className="theme-toggle-label">{LABELS[theme]}</span>
    </button>
  );
}