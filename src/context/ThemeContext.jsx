// src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────
//  Handles:
//   • dark / light / system theme
//   • brand primary color (company-level customization)
//   • persists to localStorage — survives page refresh
//   • injects [data-theme="dark"] on <html> so ALL CSS vars flip
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext();

const STORAGE_KEY_THEME  = "tm_theme";   // "light" | "dark" | "system"
const STORAGE_KEY_COLOR  = "tm_brand";   // hex string e.g. "#6366f1"

const DEFAULT_BRAND = "#6366f1";         // indigo — matches your existing design

// Preset brand palettes a company can pick
export const BRAND_PRESETS = [
  { label: "Indigo",  value: "#6366f1" },
  { label: "Violet",  value: "#7c3aed" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Cyan",    value: "#0891b2" },
  { label: "Teal",    value: "#0d9488" },
  { label: "Green",   value: "#16a34a" },
  { label: "Rose",    value: "#e11d48" },
  { label: "Orange",  value: "#ea580c" },
];

// Given a hex brand color, derive the full shade ramp so CSS vars work
function deriveShades(hex) {
  // Simple approach: lighten/darken the base hex for each stop
  // We keep it light so it doesn't need an npm package
  return {
    "--brand-500": hex,
    "--brand-600": shiftLightness(hex, -10),
    "--brand-700": shiftLightness(hex, -20),
    "--brand-400": shiftLightness(hex, +15),
    "--brand-300": shiftLightness(hex, +30),
    "--brand-200": shiftLightness(hex, +45),
    "--brand-100": shiftLightness(hex, +55),
    "--brand-50":  shiftLightness(hex, +62),
    "--brand-800": shiftLightness(hex, -30),
    "--brand-900": shiftLightness(hex, -40),
    "--shadow-brand": `0 6px 20px ${hex}44`,
  };
}

function shiftLightness(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  // Convert to HSL, shift L, convert back
  const [h, s, l] = rgbToHsl(r, g, b);
  const newL = Math.min(98, Math.max(2, l + amount));
  const [nr, ng, nb] = hslToRgb(h, s, newL);
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s * 100, l * 100];
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function toHex(n) { return n.toString(16).padStart(2, "0"); }

// Apply theme + brand to <html> element
function applyTheme(mode, brandColor) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);

  if (isDark) {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }

  // Apply brand shades as CSS vars on :root
  const shades = deriveShades(brandColor || DEFAULT_BRAND);
  Object.entries(shades).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY_THEME) || "light"
  );
  const [brandColor, setBrandColorState] = useState(
    () => localStorage.getItem(STORAGE_KEY_COLOR) || DEFAULT_BRAND
  );

  // Apply on mount + whenever theme/brand changes
  useEffect(() => {
    applyTheme(theme, brandColor);
  }, [theme, brandColor]);

  // Listen for system preference changes when mode = "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system", brandColor);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, brandColor]);

  const setTheme = useCallback((newTheme) => {
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    setThemeState(newTheme);
  }, []);

  const setBrandColor = useCallback((color) => {
    localStorage.setItem(STORAGE_KEY_COLOR, color);
    setBrandColorState(color);
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, brandColor, setBrandColor, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);