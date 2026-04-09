import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import TaskForm from "../components/TaskForm";
import TaskTable from "../components/TaskTable";
import socketService from "../services/socketService";

export default function IssuePage({ selectedProject, staff, statuses }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fetchTasksRef = useRef(null);

  // Join project room for real-time updates
  useEffect(() => {
    if (selectedProject?._id) {
      socketService.joinProject(selectedProject._id);
      return () => {
        socketService.leaveProject(selectedProject._id);
      };
    }
  }, [selectedProject]);

  // Listen for real-time issue updates
  useEffect(() => {
    const unsub1 = socketService.onIssueCreated(() => {
      console.log("✅ New issue created - refreshing list");
      if (fetchTasksRef.current) fetchTasksRef.current();
    });

    const unsub2 = socketService.onIssueDeleted(() => {
      console.log("✅ Issue deleted - refreshing list");
      if (fetchTasksRef.current) fetchTasksRef.current();
    });

    const unsub3 = socketService.onIssueStatusChanged(() => {
      console.log("✅ Issue status changed - refreshing list");
      if (fetchTasksRef.current) fetchTasksRef.current();
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, []);

  // Store fetch function reference for socket listeners
  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
  }, [selectedProject?._id]);

  const fetchTasks = async () => {
    const data = await api(`/tasks?project=${selectedProject._id}`);
    setTasks(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProject]);

  const handleSubmit = async (formData) => {
    formData.append("folder", "issue"); // store as "issue"
    await api("/tasks", { method: "POST", body: formData });
    fetchTasks();
    setShowForm(false);
  };

  return (
    <div className="permission-page">
      <div className="page-header">
        <h2>Issue Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Create Issue
        </button>
      </div>

      {showForm && (
        <TaskForm
          type="issue"
          staff={staff}
          statuses={statuses}
          selectedProject={selectedProject}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <TaskTable tasks={tasks} statuses={statuses} staff={staff} type="all" />
    </div>
  );
}