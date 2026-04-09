import { api } from "../api";

/**
 * Project Service - API calls for project management with company support
 */

// ========================================
// CREATE PROJECT
// ========================================
export const createProject = async (projectData) => {
  try {
    const response = await api.post("/projects", {
      name: projectData.name,
      description: projectData.description,
      type: projectData.type || "Business",
      members: projectData.members || [],
      company: projectData.company, // ✅ INCLUDE COMPANY ID
      status: projectData.status || "Active",
      dueDate: projectData.dueDate,
    });
    return response;
  } catch (error) {
    console.error("Create project error:", error);
    throw error;
  }
};

// ========================================
// GET ALL PROJECTS (with company filter)
// ========================================
export const getProjects = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // ✅ ADD COMPANY FILTER
    if (filters.company) {
      params.append("company", filters.company);
    }

    if (filters.search) {
      params.append("search", filters.search);
    }

    if (filters.type) {
      params.append("type", filters.type);
    }

    const response = await api.get(`/projects?${params.toString()}`);
    return response;
  } catch (error) {
    console.error("Get projects error:", error);
    throw error;
  }
};

// ========================================
// GET SINGLE PROJECT
// ========================================
export const getProjectById = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response;
  } catch (error) {
    console.error("Get project by ID error:", error);
    throw error;
  }
};

// ========================================
// UPDATE PROJECT
// ========================================
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await api.put(`/projects/${projectId}`, {
      name: updateData.name,
      description: updateData.description,
      type: updateData.type,
      members: updateData.members,
      status: updateData.status,
      dueDate: updateData.dueDate,
      isActive: updateData.isActive,
      company: updateData.company, // ✅ ALLOW COMPANY UPDATE
    });
    return response;
  } catch (error) {
    console.error("Update project error:", error);
    throw error;
  }
};

// ========================================
// DELETE PROJECT
// ========================================
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response;
  } catch (error) {
    console.error("Delete project error:", error);
    throw error;
  }
};

// ========================================
// GET PROJECT TEAM
// ========================================
export const getProjectTeam = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/team`);
    return response;
  } catch (error) {
    console.error("Get project team error:", error);
    throw error;
  }
};

// ========================================
// GET PROJECTS BY COMPANY (convenient helper)
// ========================================
export const getProjectsByCompany = async (companyId, filters = {}) => {
  try {
    return await getProjects({
      ...filters,
      company: companyId, // ✅ FILTER BY COMPANY
    });
  } catch (error) {
    console.error("Get projects by company error:", error);
    throw error;
  }
};

// ========================================
// COUNT PROJECTS BY COMPANY
// ========================================
export const countProjectsByCompany = async (companyId) => {
  try {
    const response = await getProjects({
      company: companyId,
    });
    return response.length || 0;
  } catch (error) {
    console.error("Count projects error:", error);
    return 0;
  }
};

// ========================================
// GET ACTIVE PROJECTS BY COMPANY
// ========================================
export const getActiveProjectsByCompany = async (companyId) => {
  try {
    const response = await getProjects({
      company: companyId,
    });
    return response.filter((p) => p.status === "Active" || p.isActive);
  } catch (error) {
    console.error("Get active projects error:", error);
    return [];
  }
};

// ========================================
// EXPORT PROJECTS
// ========================================
export const exportProjects = async (companyId) => {
  try {
    const response = await getProjectsByCompany(companyId);
    return response;
  } catch (error) {
    console.error("Export projects error:", error);
    throw error;
  }
};

// ========================================
// ARCHIVE PROJECT
// ========================================
export const archiveProject = async (projectId) => {
  try {
    const response = await updateProject(projectId, {
      status: "Archived",
      isActive: false,
    });
    return response;
  } catch (error) {
    console.error("Archive project error:", error);
    throw error;
  }
};

// ========================================
// UNARCHIVE PROJECT
// ========================================
export const unarchiveProject = async (projectId) => {
  try {
    const response = await updateProject(projectId, {
      status: "Active",
      isActive: true,
    });
    return response;
  } catch (error) {
    console.error("Unarchive project error:", error);
    throw error;
  }
};

export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectTeam,
  getProjectsByCompany,
  countProjectsByCompany,
  getActiveProjectsByCompany,
  exportProjects,
  archiveProject,
  unarchiveProject,
};