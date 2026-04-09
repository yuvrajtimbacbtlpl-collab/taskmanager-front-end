// src/components/ui/SearchBox.jsx
// Reusable search input with icon, debounce support, and clear button

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
  debounce = 0,        // milliseconds delay; 0 = instant
  onClear,
  width = "320px",
  disabled = false,
}) {
  const [localValue, setLocalValue] = useState(value || "");
  const timerRef = useRef(null);

  // Keep local value in sync if parent controls it
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounce > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange && onChange(val);
      }, debounce);
    } else {
      onChange && onChange(val);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    onChange && onChange("");
    onClear && onClear();
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Search icon */}
      <Search
        size={15}
        style={{
          position: "absolute",
          left: "11px",
          color: "var(--gray-400)",
          pointerEvents: "none",
          flexShrink: 0,
        }}
      />

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "9px 36px 9px 34px",
          borderRadius: "var(--radius-md)",
          border: "1.5px solid var(--border-base)",
          fontSize: "13.5px",
          color: "var(--gray-800)",
          background: "var(--gray-0)",
          fontFamily: "var(--font-body)",
          transition: "all var(--ease-base)",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--brand-400)";
          e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.10)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border-base)";
          e.target.style.boxShadow = "none";
        }}
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "10px",
            background: "var(--gray-200)",
            border: "none",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--gray-500)",
            padding: 0,
            transition: "all var(--ease-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--gray-300)";
            e.currentTarget.style.color = "var(--gray-800)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--gray-200)";
            e.currentTarget.style.color = "var(--gray-500)";
          }}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
