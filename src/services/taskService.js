// src/services/taskService.js

import { api } from "../api";

const taskService = {
  /**
   * Create a new task
   * @param {Object} taskData - Task details
   * @param {File[]} mediaFiles - Optional media files
   */
  createTask: async (taskData, mediaFiles = []) => {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append("title", taskData.title);
      formData.append("description", taskData.description || "");
      formData.append("assignedTo", taskData.assignedTo);
      formData.append("status", taskData.status);
      formData.append("project", taskData.project);
      formData.append("company", taskData.company); // ✅ COMPANY
      formData.append("type", taskData.type || "task");
      formData.append("priority", taskData.priority || "Normal");
      formData.append("dueDate", taskData.dueDate || "");
      formData.append("appLink", taskData.appLink || "");
      // ✅ Hour-based scheduling fields
      if (taskData.estimatedHours) formData.append("estimatedHours", taskData.estimatedHours);

      // Add media files
      mediaFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("media", file);
        }
      });

      console.log("📤 Creating task with company:", taskData.company);

      const response = await api("/tasks", {
        method: "POST",
        body: formData,
      });

      console.log("✅ Task created:", response);
      return response;
    } catch (error) {
      console.error("❌ Create task error:", error);
      throw error;
    }
  },

  /**
   * Update an existing task
   * @param {string} taskId - Task ID to update
   * @param {Object} taskData - Updated task details
   * @param {File[]} mediaFiles - Optional new media files
   */
  updateTask: async (taskId, taskData, mediaFiles = []) => {
    try {
      const formData = new FormData();

      // Add text fields
      if (taskData.title) formData.append("title", taskData.title);
      if (taskData.description !== undefined)
        formData.append("description", taskData.description);
      if (taskData.assignedTo) formData.append("assignedTo", taskData.assignedTo);
      if (taskData.status) formData.append("status", taskData.status);
      if (taskData.project) formData.append("project", taskData.project);
      if (taskData.company) formData.append("company", taskData.company); // ✅ COMPANY
      if (taskData.type) formData.append("type", taskData.type);
      if (taskData.priority) formData.append("priority", taskData.priority);
      if (taskData.dueDate) formData.append("dueDate", taskData.dueDate);
      // ✅ Hour-based scheduling fields
      if (taskData.estimatedHours) formData.append("estimatedHours", taskData.estimatedHours);
      if (taskData.appLink) formData.append("appLink", taskData.appLink);

      // Add media files
      mediaFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("media", file);
        }
      });

      console.log("📤 Updating task:", taskId, "with company:", taskData.company);

      const response = await api(`/tasks/${taskId}`, {
        method: "PUT",
        body: formData,
      });

      console.log("✅ Task updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Update task error:", error);
      throw error;
    }
  },

  /**
   * Get all tasks with filters
   * @param {Object} filters - Filter options
   */
  getTasks: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.project) params.append("project", filters.project);
      if (filters.company) params.append("company", filters.company); // ✅ COMPANY
      if (filters.status) params.append("status", filters.status);
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
      if (filters.type) params.append("type", filters.type || "task");
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const url = `/tasks?${params.toString()}`;
      console.log("📥 Fetching tasks from:", url);

      const response = await api(url);

      console.log("✅ Tasks fetched:", response.data?.length || 0);
      return response;
    } catch (error) {
      console.error("❌ Get tasks error:", error);
      throw error;
    }
  },

  /**
   * Get tasks assigned to current user
   * @param {Object} filters - Filter options
   */
  getMyTasks: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.company) params.append("company", filters.company); // ✅ COMPANY
      if (filters.status) params.append("status", filters.status);
      if (filters.project) params.append("project", filters.project);
      if (filters.type) params.append("type", filters.type || "task");
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const url = `/tasks/my-tasks?${params.toString()}`;
      const response = await api(url);

      return response;
    } catch (error) {
      console.error("❌ Get my tasks error:", error);
      throw error;
    }
  },

  /**
   * Delete a task
   * @param {string} taskId - Task ID to delete
   */
  deleteTask: async (taskId) => {
    try {
      console.log("🗑️ Deleting task:", taskId);

      const response = await api(`/tasks/${taskId}`, {
        method: "DELETE",
      });

      console.log("✅ Task deleted");
      return response;
    } catch (error) {
      console.error("❌ Delete task error:", error);
      throw error;
    }
  },

  /**
   * Get single task by ID
   * @param {string} taskId - Task ID
   */
  getTaskById: async (taskId) => {
    try {
      const response = await api(`/tasks/${taskId}`);
      return response;
    } catch (error) {
      console.error("❌ Get task error:", error);
      throw error;
    }
  },

  /**
   * Bulk upload tasks from Excel file
   * @param {File} file - Excel file
   * @param {string} projectId - Project ID
   * @param {string} companyId - Company ID
   * @param {string} type - Task type (task/issue)
   */
  bulkUploadTasks: async (file, projectId, companyId, type = "task") => {
    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("project", projectId);
      formData.append("company", companyId); // ✅ COMPANY
      formData.append("type", type);

      console.log("📤 Bulk uploading tasks for company:", companyId);

      const response = await api("/tasks/bulk-upload", {
        method: "POST",
        body: formData,
      });

      console.log("✅ Bulk upload completed:", response);
      return response;
    } catch (error) {
      console.error("❌ Bulk upload error:", error);
      throw error;
    }
  },
};

export default taskService;