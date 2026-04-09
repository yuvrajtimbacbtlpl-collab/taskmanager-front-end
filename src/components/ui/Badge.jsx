// src/components/ui/Badge.jsx
// Reusable status badge and generic label badge

/**
 * StatusBadge  — for active / inactive / pending / custom labels
 * Badge        — generic colored chip (brand, gray, green, red, etc.)
 */

const STATUS_CONFIG = {
  active:   { bg: "var(--success-light)",  color: "var(--success-base)",  dot: true },
  inactive: { bg: "var(--error-light)",    color: "var(--error-base)",    dot: true },
  pending:  { bg: "var(--warning-light)",  color: "var(--warning-base)",  dot: true },
  completed:{ bg: "var(--success-light)",  color: "var(--success-base)",  dot: true },
  open:     { bg: "var(--info-light)",     color: "var(--info-base)",     dot: true },
  closed:   { bg: "var(--gray-100)",       color: "var(--gray-500)",      dot: true },
  review:   { bg: "#fef3c7",              color: "#d97706",              dot: true },
  default:  { bg: "var(--brand-50)",       color: "var(--brand-700)",     dot: false },
};

export function StatusBadge({ status = "active", label, className = "" }) {
  const key = (status || "").toLowerCase();
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.default;
  const displayLabel = label || (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: "12px",
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        whiteSpace: "nowrap",
        lineHeight: 1,
        fontFamily: "var(--font-body)",
      }}
    >
      {config.dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: config.color,
            opacity: 0.75,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}

// Alias for the existing .status-badge class-based usage
export default function Badge({
  children,
  color = "brand", // brand | green | red | yellow | gray | blue
  size = "sm",
}) {
  const colorMap = {
    brand:  { bg: "var(--brand-50)",      color: "var(--brand-700)",  border: "var(--brand-200)" },
    green:  { bg: "var(--success-light)", color: "var(--success-base)", border: "transparent" },
    red:    { bg: "var(--error-light)",   color: "var(--error-base)",   border: "transparent" },
    yellow: { bg: "var(--warning-light)", color: "var(--warning-base)", border: "transparent" },
    gray:   { bg: "var(--gray-100)",      color: "var(--gray-600)",     border: "var(--border-base)" },
    blue:   { bg: "var(--info-light)",    color: "var(--info-base)",    border: "transparent" },
  };

  const c = colorMap[color] || colorMap.brand;
  const padMap = { sm: "3px 9px", md: "5px 12px", lg: "7px 16px" };
  const sizeMap = { sm: "12px", md: "13px", lg: "14px" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: padMap[size],
        borderRadius: "var(--radius-full)",
        fontSize: sizeMap[size],
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </span>
  );
}
