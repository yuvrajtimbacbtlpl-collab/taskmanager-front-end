// src/components/StatusBadge.jsx
// Reusable status badge — uses your exact .status-badge CSS class
//
// Props:
//   value — "active" | "inactive" | "pending" | any string
//   label — override display text (optional, defaults to value)
//
// Usage:
//   <StatusBadge value={row.isActive ? "active" : "inactive"} />
//   <StatusBadge value="active" label="Live" />
//
// CSS classes used: .status-badge .active / .inactive (from your styles.css / dashboard.css)

export default function StatusBadge({ value = "", label }) {
  const key = (value || "").toString().toLowerCase();

  // Map to your exact existing CSS class names
  const classMap = {
    active:    "active",
    true:      "active",
    inactive:  "inactive",
    false:     "inactive",
    pending:   "inactive",  // no .pending class in original, fallback
  };

  const cssClass = classMap[key] || "";
  const displayText = label || (value.toString().charAt(0).toUpperCase() + value.toString().slice(1));

  return (
    <span className={`status-badge ${cssClass}`}>
      {displayText}
    </span>
  );
}
