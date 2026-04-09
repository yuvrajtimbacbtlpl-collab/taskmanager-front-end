// src/components/FilterBar.jsx
// Reusable filter/search bar — uses your existing .filter-bar CSS classes
//
// Props:
//   searchValue    — string
//   onSearchChange — fn(value)
//   searchPlaceholder — string (default: "Search...")
//   filters        — array of { value, onChange, options: [{value, label}], placeholder }
//   rightContent   — ReactNode (extra buttons/controls on the right)
//
// Usage:
//   <FilterBar
//     searchValue={search}
//     onSearchChange={setSearch}
//     searchPlaceholder="Search by name or email..."
//     filters={[
//       {
//         value: selectedRole,
//         onChange: (e) => setSelectedRole(e.target.value),
//         placeholder: "All Roles",
//         options: roles.map(r => ({ value: r._id, label: r.name })),
//       }
//     ]}
//   />

export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  rightContent,
}) {
  return (
    <div className="filter-bar">
      {/* Search input */}
      {onSearchChange !== undefined && (
        <div className="filter-left">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Dropdown filters + optional extra right content */}
      <div className="filter-right-group">
        {filters.map((filter, i) => (
          <select
            key={i}
            value={filter.value}
            onChange={filter.onChange}
          >
            {filter.placeholder && (
              <option value="">{filter.placeholder}</option>
            )}
            {(filter.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {rightContent}
      </div>
    </div>
  );
}
