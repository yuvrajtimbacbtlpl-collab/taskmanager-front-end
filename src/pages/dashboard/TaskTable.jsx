export default function TaskTable({ tasks, statuses, staff, type = "task" }) {
  return (
    <table className="common-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Assigned To</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {tasks
          .filter((t) => (type === "all" ? true : t.folder === type))
          .map((task) => (
            <tr key={task._id}>
              <td>{task.title}</td>
              <td>{task.status}</td>
              <td>{task.assignedTo?.username}</td>
              <td>{task.folder}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}