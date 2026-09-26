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
  X
} from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'sh-badge-danger',
  high:   'sh-badge-warning',
  medium: 'sh-badge-olive',
  low:    'sh-badge-olive',
};

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
      setTasks(Array.isArray(data) ? data : []);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FFFBF4] flex items-center gap-2 font-display">
              <CheckSquare className="w-5 h-5 text-[#8E9B7A]" strokeWidth={1.75} />
              Assignments & Tasks
            </h1>
            <p className="text-xs text-[#8D8777] mt-0.5">
              Organize coursework deadlines, problem sets, and daily academic goals.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="sh-btn-primary gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add Assignment</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="sh-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 border border-[#36362F]">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            {['', 'pending', 'in_progress', 'completed'].map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    isSelected
                      ? 'bg-[#FFFBF4] text-[#11120D] font-semibold'
                      : 'bg-[#11120D] text-[#D8CFBC] hover:bg-[#24241E] border border-[#36362F]'
                  }`}
                >
                  {st ? st.replace('_', ' ') : 'All Tasks'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8D8777] font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="sh-select"
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
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No assignments or tasks found"
            description="You are all caught up! Create a new task to organize your upcoming deadlines."
            action={{
              label: 'Create Task',
              onClick: () => setShowModal(true),
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl sh-card border transition-all flex items-center justify-between gap-3 group ${
                    isCompleted
                      ? 'border-[#36362F] opacity-60 bg-[#11120D]'
                      : 'border-[#36362F] hover:border-[#565449]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="text-[#8D8777] hover:text-[#8E9B7A] transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#8E9B7A]" strokeWidth={1.75} />
                      ) : (
                        <Circle className="w-5 h-5" strokeWidth={1.75} />
                      )}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <span className={`text-xs font-medium block truncate ${isCompleted ? 'line-through text-[#8D8777]' : 'text-[#FFFBF4]'}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-[11px] text-[#8D8777] line-clamp-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-[#8D8777] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" strokeWidth={1.75} />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[9px] font-bold ${PRIORITY_BADGE[task.priority] || 'sh-badge-olive'}`}>
                      {task.priority.toUpperCase()}
                    </span>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded text-[#8D8777] hover:text-[#C76A5E] hover:bg-[#C76A5E]/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full sh-glass-strong rounded-2xl p-6 border border-[#36362F] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
              <h3 className="text-sm font-bold text-[#FFFBF4] font-display">Create Assignment / Task</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs text-[#D8CFBC] block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Machine Learning Assignment 3"
                  className="sh-input"
                />
              </div>

              <div>
                <label className="text-xs text-[#D8CFBC] block mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Submission portal link, group partner info, or hints..."
                  rows={2}
                  className="sh-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#D8CFBC] block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="sh-select w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#D8CFBC] block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="sh-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="sh-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn-primary"
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
