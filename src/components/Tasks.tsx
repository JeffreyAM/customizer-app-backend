import React, { useState, useEffect } from "react";

type MockupTask = {
  id: string;
  task_key: string;
  created_at: string;
};

const TasksPage = () => {
  const [tasks, setTasks] = useState<MockupTask[]>([]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/printful/mockup-tasks");
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
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Tasks Page</h1>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="bg-gray-100 p-2 rounded-md">
              <p>
                <strong>Task Key:</strong> {task.task_key}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(task.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksPage;
