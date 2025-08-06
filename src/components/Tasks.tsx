import React, { useState, useEffect } from "react";

type MockupTask = {
  id: string;
  task_key: string;
  created_at: string;
  status: "pending" | "completed" | "failed";
};

const TasksPage = () => {
  const [tasks, setTasks] = useState<MockupTask[]>([]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/mockup-tasks");
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mockup Tasks</h1>
        <button onClick={fetchTasks} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Refresh
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="text-gray-500 text-center py-8 border rounded bg-gray-50">No tasks found.</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-sm text-gray-500">Task Key</div>
                <div className="font-mono text-lg">{task.task_key}</div>
                <div className="text-xs text-gray-400 mt-1">Created: {new Date(task.created_at).toLocaleString()}</div>
              </div>
              <div className="mt-2 md:mt-0">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
