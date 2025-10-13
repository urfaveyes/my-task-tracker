import React, { useState, useEffect, useRef } from 'react';

// Utility function to get today's date in YYYY-MM-DD format (local time)
const todayLocalISO = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface Task {
  id: string;
  title: string;
  createdAt: string;
  archived: boolean;
}

interface CompletionRecord {
  taskId: string;
  date: string;
}

const DailyTaskTick: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const currentLocalISODate = useRef(todayLocalISO());

  // Load tasks and completions from localStorage on initial mount
  useEffect(() => {
    const storedTasks = localStorage.getItem('dailyTaskTick_tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    const storedCompletions = localStorage.getItem('dailyTaskTick_completions');
    const lastCompletionDate = localStorage.getItem('dailyTaskTick_lastCompletionDate');

    if (lastCompletionDate === currentLocalISODate.current && storedCompletions) {
      // Same day, load existing completions
      setCompletions(JSON.parse(storedCompletions));
    } else {
      // New day or no previous date, reset completions
      setCompletions([]);
      localStorage.setItem('dailyTaskTick_completions', JSON.stringify([]));
    }
    localStorage.setItem('dailyTaskTick_lastCompletionDate', currentLocalISODate.current);
  }, []);

  // Save tasks and completions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dailyTaskTick_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dailyTaskTick_completions', JSON.stringify(completions));
  }, [completions]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() === '') return;

    const newTask: Task = {
      id: Date.now().toString(), // Simple unique ID
      title: newTaskTitle.trim(),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setNewTaskTitle('');
  };

  const handleToggleCompletion = (taskId: string) => {
    const isCompleted = completions.some(
      (c) => c.taskId === taskId && c.date === currentLocalISODate.current
    );

    if (isCompleted) {
      setCompletions((prev) =>
        prev.filter((c) => !(c.taskId === taskId && c.date === currentLocalISODate.current))
      );
    } else {
      setCompletions((prev) => [
        ...prev,
        { taskId, date: currentLocalISODate.current },
      ]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setCompletions((prev) => prev.filter((c) => c.taskId !== taskId)); // Also remove associated completions
    }
  };

  const handleEditTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(currentTitle);
  };

  const handleSaveEdit = (taskId: string) => {
    if (editingTaskTitle.trim() === '') return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, title: editingTaskTitle.trim() } : task
      )
    );
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleResetTodayCompletions = () => {
    if (window.confirm('Are you sure you want to reset all completions for today?')) {
      setCompletions((prev) =>
        prev.filter((c) => c.date !== currentLocalISODate.current)
      );
    }
  };

  const completedTodayCount = completions.filter(
    (c) => c.date === currentLocalISODate.current
  ).length;
  const totalTasksCount = tasks.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8 border border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center tracking-tight">
          Daily Task Tick
        </h1>
        <p className="text-center text-gray-600 mb-6 text-lg">
          Today: <span className="font-semibold text-blue-600">{currentLocalISODate.current}</span>
        </p>

        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task (e.g., Workout)"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Add Task
          </button>
        </form>

        {totalTasksCount > 0 && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg text-gray-700 font-medium">
              Completed today: <span className="font-bold text-green-600">{completedTodayCount}</span> / {totalTasksCount}
            </p>
            <button
              onClick={handleResetTodayCompletions}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
            >
              Reset Today
            </button>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 text-lg py-8">No tasks yet. Add one above!</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => {
              const isCompletedToday = completions.some(
                (c) => c.taskId === task.id && c.date === currentLocalISODate.current
              );
              const taskItemClasses = `flex items-center p-4 border rounded-lg shadow-sm transition-all duration-200 ${isCompletedToday ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`;

              return (
                <li key={task.id} className={taskItemClasses}>
                  <input
                    type="checkbox"
                    checked={isCompletedToday}
                    onChange={() => handleToggleCompletion(task.id)}
                    className="form-checkbox h-6 w-6 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  {
                    editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(task.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-grow ml-4 p-2 border border-blue-300 rounded-md focus:ring-1 focus:ring-blue-400 text-lg font-medium text-gray-800"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`flex-grow ml-4 text-lg font-medium ${isCompletedToday ? 'text-green-700 line-through' : 'text-gray-800'}`}
                      >
                        {task.title}
                      </span>
                    )
                  }

                  <div className="flex items-center ml-auto space-x-2">
                    {isCompletedToday && (
                      <span className="text-green-600 text-sm font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Completed today
                      </span>
                    )}
                    {editingTaskId !== task.id && (
                      <button
                        onClick={() => handleEditTask(task.id, task.title)}
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors duration-150"
                        title="Edit task"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-6.707 6.707L10.586 7.586 7.586 4.586 4.586 7.586l3.707 3.707zM4 13.5V16h2.5L14.793 7.207l-2.828-2.828L4 13.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors duration-150"
                      title="Delete task"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DailyTaskTick;
