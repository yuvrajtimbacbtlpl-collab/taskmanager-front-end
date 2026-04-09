// src/components/ui/FormField.jsx
// Reusable form field wrapper — handles label, input/select/textarea + error

/**
 * FormField
 * Props:
 *   label       - string (visible label)
 *   error       - string (error message, shown in red)
 *   required    - boolean
 *   children    - ReactNode (the actual input/select/etc)
 *   hint        - string (optional hint text below field)
 */
export function FormField({ label, error, required = false, hint, children }) {
  return (
    <div className="field">
      {label && (
        <label>
          {label}
          {required && (
            <span
              style={{ color: "var(--error-base)", marginLeft: "3px" }}
            >
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <span
          style={{
            fontSize: "12px",
            color: "var(--gray-400)",
            marginTop: "4px",
          }}
        >
          {hint}
        </span>
      )}

      {error && (
        <span className="error-text">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
            <path d="M6 3.5V6.5" stroke="currentColor" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * TextInput — pre-styled input for use inside FormField
 */
export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled = false,
  ...rest
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={error ? "input-error" : ""}
      {...rest}
    />
  );
}

/**
 * SelectInput — pre-styled select for use inside FormField
 */
export function SelectInput({
  value,
  onChange,
  children,
  placeholder = "Select...",
  error,
  disabled = false,
  ...rest
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={error ? "input-error" : ""}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

/**
 * TextArea — pre-styled textarea for use inside FormField
 */
export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  disabled = false,
  ...rest
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={error ? "input-error" : ""}
      {...rest}
    />
  );
}

export default FormField;
