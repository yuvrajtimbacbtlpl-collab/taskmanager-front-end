// src/components/ui/Button.jsx
// Reusable button component with multiple variants and loading state

export default function Button({
  children,
  variant = "primary", // primary | secondary | danger | ghost | outline
  size = "md",         // sm | md | lg
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = "left",
  onClick,
  type = "button",
  className = "",
  ...rest
}) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    transition: "all var(--ease-base)",
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
  };

  const sizes = {
    sm: { padding: "6px 14px", fontSize: "12.5px" },
    md: { padding: "9px 18px", fontSize: "13.5px" },
    lg: { padding: "12px 24px", fontSize: "15px" },
  };

  const variants = {
    primary: {
      background: "var(--brand-600)",
      color: "#fff",
    },
    secondary: {
      background: "var(--gray-100)",
      color: "var(--gray-700)",
      border: "1px solid var(--border-subtle)",
    },
    danger: {
      background: "var(--error-base)",
      color: "#fff",
    },
    ghost: {
      background: "transparent",
      color: "var(--gray-600)",
    },
    outline: {
      background: "transparent",
      color: "var(--brand-600)",
      border: "1.5px solid var(--brand-400)",
    },
  };

  const combinedStyle = {
    ...baseStyle,
    ...sizes[size],
    ...variants[variant],
  };

  const spinner = (
    <span
      style={{
        width: "14px",
        height: "14px",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "rgba(255,255,255,0.95)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );

  return (
    <button
      type={type}
      style={combinedStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {loading && iconPosition === "left" && spinner}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
      {loading && iconPosition === "right" && spinner}
    </button>
  );
}
