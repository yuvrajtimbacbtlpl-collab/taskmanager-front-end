// src/components/ThemeSettings.jsx
// ─────────────────────────────────────────────────────────────
//  Full theme settings panel — embed inside ProfileModal or a
//  dedicated Settings page.
//  Shows: theme mode cards + brand color presets + custom hex
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useTheme, BRAND_PRESETS } from "../context/ThemeContext";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import "../styles/ThemeSettings.css";

const MODE_OPTIONS = [
  { value: "light",  Icon: Sun,     label: "Light",  desc: "Always light" },
  { value: "dark",   Icon: Moon,    label: "Dark",   desc: "Always dark" },
  { value: "system", Icon: Monitor, label: "System", desc: "Follow device" },
];

export default function ThemeSettings() {
  const { theme, setTheme, brandColor, setBrandColor } = useTheme();
  const [customHex, setCustomHex] = useState(brandColor);
  const [hexError, setHexError]   = useState("");

  const handleCustomHex = (val) => {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHexError("");
      setBrandColor(val);
    } else {
      setHexError("Enter a valid hex like #4f46e5");
    }
  };

  return (
    <div className="theme-settings">
      {/* ── Mode ── */}
      <div className="ts-section">
        <p className="ts-label">Appearance</p>
        <div className="ts-mode-row">
          {MODE_OPTIONS.map(({ value, Icon, label, desc }) => (
            <button
              key={value}
              className={`ts-mode-card ${theme === value ? "active" : ""}`}
              onClick={() => setTheme(value)}
            >
              <Icon size={20} />
              <span className="ts-mode-name">{label}</span>
              <span className="ts-mode-desc">{desc}</span>
              {theme === value && (
                <span className="ts-mode-check"><Check size={11} /></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Brand Color ── */}
      <div className="ts-section">
        <p className="ts-label">Brand color</p>
        <div className="ts-presets">
          {BRAND_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              title={label}
              className={`ts-color-dot ${brandColor === value ? "active" : ""}`}
              style={{ background: value }}
              onClick={() => { setBrandColor(value); setCustomHex(value); }}
            >
              {brandColor === value && <Check size={10} color="#fff" />}
            </button>
          ))}
        </div>

        {/* Custom hex input */}
        <div className="ts-hex-row">
          <div
            className="ts-hex-preview"
            style={{ background: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#e2e8f0" }}
          />
          <input
            type="text"
            className="ts-hex-input"
            value={customHex}
            maxLength={7}
            placeholder="#6366f1"
            onChange={(e) => handleCustomHex(e.target.value)}
          />
          <input
            type="color"
            className="ts-color-picker"
            value={customHex.match(/^#[0-9A-Fa-f]{6}$/) ? customHex : "#6366f1"}
            onChange={(e) => { setCustomHex(e.target.value); setBrandColor(e.target.value); }}
            title="Pick any color"
          />
        </div>
        {hexError && <p className="ts-hex-error">{hexError}</p>}
      </div>
    </div>
  );
}