// src/components/ui/PageHeader.jsx
// Consistent page header with title, optional subtitle and action buttons

/**
 * PageHeader
 * Props:
 *   title      - string (main heading)
 *   subtitle   - string (optional secondary text)
 *   actions    - ReactNode (buttons / controls on the right)
 *   breadcrumb - string[] (optional breadcrumb path)
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "22px",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      {/* Left: title + optional breadcrumb/subtitle */}
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
              fontSize: "12.5px",
              color: "var(--gray-400)",
            }}
          >
            {breadcrumb.map((crumb, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {i > 0 && (
                  <span style={{ color: "var(--gray-300)" }}>›</span>
                )}
                <span
                  style={{
                    color: i === breadcrumb.length - 1
                      ? "var(--gray-600)"
                      : "var(--brand-500)",
                    fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                    cursor: i < breadcrumb.length - 1 ? "pointer" : "default",
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}

        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--gray-900)",
            letterSpacing: "-0.4px",
            margin: 0,
            lineHeight: 1.2,
            fontFamily: "var(--font-body)",
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            style={{
              margin: "5px 0 0",
              fontSize: "14px",
              color: "var(--gray-500)",
              fontWeight: 400,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
