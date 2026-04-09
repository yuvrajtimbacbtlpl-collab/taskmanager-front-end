// src/hooks/useToast.js
import { useState, useCallback } from "react";

export default function useToast() {
  const [toast, setToast] = useState(null);

  // type: "success" | "warning" | "error"
  const showToast = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}