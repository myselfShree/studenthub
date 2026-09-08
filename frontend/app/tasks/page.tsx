'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { Task } from '@/types';
import { 
  Plus, 
  CheckSquare, 
  Circle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  AlertCircle, 
  Filter, 
  Calendar,
  Loader2
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Task Dialog
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');

  const loadTasks = async () => {
    try {
      const data = await api.getTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  const handleToggleTask = async (task: Task) => {
    try {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTaskStatus(task.id, nextStatus);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createTask({
        title,
        description: description || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setShowModal(false);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-400" />
              Assignments & Tasks
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Organize academic assignments, lab deadlines, and daily study todos.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Assignment
          </button>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {['', 'pending', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st ? st.replace('_', ' ') : 'All Tasks'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading assignments...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-800 space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p>No assignments or tasks found matching your filter.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-semibold border border-indigo-500/30 transition-all inline-block"
            >
              Create New Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl glass-panel border transition-all flex items-center justify-between gap-4 group ${
                    isCompleted
                      ? 'border-slate-800/60 opacity-60'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <span className={`text-xs font-semibold block truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                      task.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      task.priority === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Task Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Task / Assignment</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete AI Assignment 2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or submission requirements..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
