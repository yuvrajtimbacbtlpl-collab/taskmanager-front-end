// src/hooks/useDebounce.js
// Replaces the copy-pasted debounce pattern in CreateTask, IssueManagement, etc.
//
// BEFORE (every page repeated this):
//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedSearch(search), 400);
//     return () => clearTimeout(handler);
//   }, [search]);
//
// AFTER:
//   const debouncedSearch = useDebounce(search, 400);

import { useState, useEffect } from "react";

export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
