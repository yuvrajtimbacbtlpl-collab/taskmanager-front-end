export function hasPermission(permissions = [], permission, role) {
  if (role?.toUpperCase() === "ADMIN") return true;

  if (!permissions || permissions.length === 0) return false;

  return permissions.some((p) => {
    const value =
      typeof p === "string"
        ? p
        : p?.name || p?.permission || p?.value;

    return value === permission;
  });
}
