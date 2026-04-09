// src/components/ui/EmptyState.jsx

import { Inbox } from "lucide-react";

/**
 * EmptyState — shown when table/list has no data
 */
export function EmptyState({
  icon,
  title = "No records found",
  description = "No data is available in the database.",
  action,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        gap: "12px",
        color: "var(--gray-400)",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--gray-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon || <Inbox size={26} color="var(--gray-400)" />}
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--gray-600)",
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13.5px",
              color: "var(--gray-400)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: "4px" }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

// src/components/ui/StatCard.jsx
// Reusable dashboard stat card with icon, value, label and optional trend

/**
 * StatCard
 * Props:
 *   label   - string
 *   value   - string|number
 *   icon    - ReactNode (e.g. lucide icon)
 *   iconBg  - CSS color string for icon background
 *   trend   - { value: number, label: string } (optional)
 */
export function StatCard({ label, value, icon, iconBg = "#e0e7ff", trend }) {
  const trendColor =
    trend?.value > 0
      ? "var(--success-base)"
      : trend?.value < 0
      ? "var(--error-base)"
      : "var(--gray-400)";

  return (
    <div
      className="stat-card"
      style={{
        background: "var(--gray-0)",
        borderRadius: "var(--radius-xl)",
        padding: "22px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.25s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.12)";
        e.currentTarget.style.borderColor = "var(--brand-200)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--gray-500)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 10px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "var(--gray-900)",
              letterSpacing: "-0.5px",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {value ?? "—"}
          </p>

          {trend && (
            <p
              style={{
                fontSize: "12.5px",
                color: trendColor,
                margin: "8px 0 0",
                fontWeight: 600,
              }}
            >
              {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "—"}{" "}
              {Math.abs(trend.value)}%{" "}
              <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>
                {trend.label}
              </span>
            </p>
          )}
        </div>

        {icon && (
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
