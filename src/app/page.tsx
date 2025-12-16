'use client';

import { useState, useEffect } from "react";

type Task = {
  id : number;
  title : string;
  description : string | null;
  isCompleted : boolean;
  dueDate : string | null;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  // fetch tasks (GET)
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // create/update task (POST / PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    closeModal();

    try {
      const body = {
        title: newTaskTitle,
        description: newTaskDesc,
        dueDate: newTaskDue ? newTaskDue : null,
      };

      // edit task (PUT)
      if (editingTask) {
        setTasks(tasks.map(t =>
          t.id === editingTask.id ? { ...t, ...body, dueDate: newTaskDue || null } : t
        ));

        await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // create task (POST)
        await fetch('/api/tasks', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      // reset form
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDue("");
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }

  // delete task (DELETE)
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  const toggleStatus = async (task: Task) => {
    const updatedTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    setTasks(updatedTasks);

    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    });
  };

  // open modal for editting
  const openEditModal = (task : Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || "");
    setNewTaskDue(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  }

  // open modal for creating
  const openCreateModal = () => {
    setEditingTask(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskDue("");
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isModalClosing) {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }
  };

  // group task by date
  const getGroupedTasks = () => {
    const groups: { [key: string]: Task[] } = {};

    // sort by due date
    const sortedTasks = [...tasks].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    sortedTasks.forEach((task) => {
      let key = 'No Date';
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        date.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        tomorrow.setHours(0,0,0,0);

        if (date.getTime() < today.getTime()) key = 'Overdue';
        else if (date.getTime() === today.getTime()) key = 'Today';
        else if (date.getTime() === tomorrow.getTime()) key = 'Tomorrow';
        else {
          key = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  };

  const groupedTasks = getGroupedTasks();
  const groupOrder = ['Overdue', 'Today', 'Tomorrow', ...Object.keys(groupedTasks).filter(k => !['Overdue', 'Today', 'Tomorrow', 'No Date'].includes(k)), 'No Date'];

  return (
      <main className="min-h-screen bg-gray-100 pb-24 font-sans text-gray-900">

        {/* Header */}
        <div className={`px-6 pb-6 pt-10 sticky top-0 z-10 backdrop-blur-xs ${
          isScrolled ? 'shadow-lg bg-gray-50/40' : 'shadow-none bg-transparent'
        }`}>
          <h1 className="text-3xl font-bold ">To-Do List</h1>
        </div>

        {/* Task Groups */}
        <div className="max-w-2xl mx-auto p-4 space-y-8">
          {groupOrder.map((groupName) => {
            const groupTasks = groupedTasks[groupName];
            if (!groupTasks || groupTasks.length === 0) return null;

            return (
                <div key={groupName}>
                  <h2 className={`text-xl font-bold mb-3 ${groupName === 'Overdue' ? 'text-red-500' : 'text-gray-800'}`}>
                    {groupName}
                  </h2>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    {groupTasks.map((task, index) => (
                        <div
                            key={task.id}
                            className={`flex items-start gap-3 p-4 bg-white hover:bg-gray-50 transition-colors ${
                                index !== groupTasks.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                        >
                          <button
                              onClick={() => toggleStatus(task)}
                              className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  task.isCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-500'
                              }`}
                          >
                            {task.isCompleted && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </button>

                          <div className="flex-1 cursor-pointer" onClick={() => openEditModal(task)}>
                            <p className={`font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{task.description}</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <button onClick={() => openEditModal(task)}
                                    className="text-gray-300 hover:text-blue-500 p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                   stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"/>
                              </svg>
                            </button>
                            {/* Delete Button */}
                            <button onClick={() => handleDelete(task.id)}
                                    className="text-gray-300 hover:text-red-500 p-1">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            );
          })}
        </div>

        {/* Floating Action Button */}
        <button
            onClick={openCreateModal}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gray-50/40 hover:bg-blue-500 backdrop-blur-xs rounded-full shadow-lg flex items-center justify-center text-3xl transition-transform hover:scale-105 active:scale-95 z-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
               stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>

        </button>

        {/* Modal Overlay */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              {/*Modal Backdrop*/}
              <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
                  onClick={closeModal}
              ></div>

              {/*Modal Content*/}
              <div
                  className={`relative w-full max-w-2xl bg-white rounded-t-2xl shadow-2xl p-6 ${
                      isModalClosing ? 'animate-slide-down' : 'animate-slide-up'
                  }`}
                  onAnimationEnd={handleAnimationEnd}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingTask ? 'Edit Task' : 'New Reminder'}
                  </h2>
                  <button onClick={closeModal} className="text-red-500 font-semibold">
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                      type="text"
                      placeholder="Title"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full text-lg border-b border-gray-300 py-2 focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
                  />

                  <textarea
                      placeholder="Description"
                      rows={3}
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full p-2 bg-gray-50 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black text-sm resize-none"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                    <input
                        type="date"
                        value={newTaskDue}
                        onChange={(e) => setNewTaskDue(e.target.value)}
                        className="w-full p-2 bg-gray-50 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={!newTaskTitle.trim()}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    >
                      {editingTask ? 'Save Changes' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        <style jsx global>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
        @keyframes slide-down { from { transform: translateY(0); } to {transform: translateY(100%)} }
          .animate-slide-down { animation: slide-down 0.2s ease-out forwards }
      `}</style>
      </main>
  );
}