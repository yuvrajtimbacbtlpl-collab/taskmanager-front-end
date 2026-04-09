// src/hooks/useCompany.js
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";

// ✅ Sentinel object for the "Global" option in the admin company dropdown
export const GLOBAL_COMPANY = { _id: "global", name: "Global" };

/**
 * Hook to access company information.
 * - For SUPER ADMIN: returns selectedCompany from header (can be a real company or GLOBAL_COMPANY)
 * - For others: returns the company assigned to the logged-in user.
 */
export const useCompany = () => {
  const { user } = useAuth();
  const { selectedCompany } = useProject();

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";
  const isGlobal = isAdmin && selectedCompany?._id === "global";

  /**
   * Get company ID to send in API requests.
   * - Admin + Global selected → returns "global" (backend maps this to company: null)
   * - Admin + real company selected → returns the company ObjectId string
   * - Others → returns their own company._id
   */
  const getCompanyId = () => {
    if (!user) return null;

    if (isAdmin) {
      const id = selectedCompany?._id || selectedCompany;
      return id || null; // "global" or a real ObjectId string or null
    }

    const companyId = user.company?._id || user.company;
    return companyId || null;
  };

  /**
   * Get company ID for CREATE payloads.
   * - Admin + Global → null (creates a global record visible to all companies)
   * - Admin + real company → that company's ObjectId
   * - Others → their own company._id
   */
  const getCompanyIdForCreate = () => {
    if (!user) return null;
    if (isAdmin) {
      if (isGlobal) return null; // null = global record
      return selectedCompany?._id || null;
    }
    return user.company?._id || user.company || null;
  };

  /**
   * Build a ?company=<value> query string segment for GET requests.
   * Returns empty string if not admin (backend uses req.user.company).
   */
  const getCompanyQueryParam = (prefix = "?") => {
    if (!isAdmin) return "";
    const id = getCompanyId();
    if (!id) return "";
    return `${prefix}company=${id}`;
  };

  /**
   * Get display info
   */
  const getCompanyDisplayInfo = () => {
    if (!user) return { displayText: "No company", name: null, id: null };

    if (isAdmin) {
      if (isGlobal) return { displayText: "🌐 Global", name: "Global", id: "global" };
      const name = selectedCompany?.name || null;
      const id = selectedCompany?._id || null;
      return {
        displayText: name ? `🏢 ${name}` : "🏢 Select a Company",
        name,
        id,
      };
    }

    const companyName =
      typeof user.company === "object" ? user.company?.name : "Unknown";
    const companyId =
      typeof user.company === "object" ? user.company?._id : user.company;

    return {
      displayText:
        companyName && companyName !== "Unknown"
          ? `🏢 ${companyName}`
          : "🏢 No Company Assigned",
      name: companyName,
      id: companyId,
    };
  };

  const hasCompany = () => {
    if (isAdmin) return !!selectedCompany; // global counts as "has selection"
    return !!getCompanyId();
  };

  return {
    getCompanyId,
    getCompanyIdForCreate,
    getCompanyQueryParam,
    getCompanyDisplayInfo,
    hasCompany,
    user,
    isAdmin,
    isGlobal,
    selectedCompany,
  };
};
