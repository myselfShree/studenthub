'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { DashboardOverview } from '@/types';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Bookmark, 
  ArrowRight,
  Clock,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.updateTaskStatus(taskId, newStatus);
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHabitCheckin = async (habitId: number, completedToday: boolean) => {
    try {
      if (completedToday) {
        await api.deleteCheckinHabit(habitId);
      } else {
        await api.checkinHabit(habitId);
      }
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#30363d]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {data ? data.student_name.split(' ')[0] : 'Student'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Centralized academic productivity and study overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notes"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>New Note</span>
            </Link>
            <Link
              href="/tasks"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>New Task</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Loading student metrics...</span>
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            {/* Metric Scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Tasks</span>
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.tasks.pending_count}</span>
                  {data.tasks.urgent_count > 0 && (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60">
                      {data.tasks.urgent_count} Urgent
                    </span>
                  )}
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Habits Done</span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data.habits.completed_today_count} / {data.habits.total_habits}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Today</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Smart Notes</span>
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.metrics.total_notes}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">in {data.metrics.total_subjects} Subjects</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">AI Study Sessions</span>
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.metrics.total_ai_interactions}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Prompts</span>
                </div>
              </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols */}
              <div className="lg:col-span-2 space-y-5">
                {/* Upcoming Tasks */}
                <div className="glass-panel p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#30363d]">
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                      Priority Tasks
                    </h2>
                    <Link href="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
                      View All ({data.tasks.pending_count})
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  {data.tasks.upcoming_tasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-600 dark:text-slate-400">
                      No pending tasks. Great job staying ahead!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.tasks.upcoming_tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#1c2128]/50 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-900 dark:text-slate-200 block truncate">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock size={10} />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            task.priority === 'urgent' ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60' :
                            task.priority === 'high' ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60' :
                            task.priority === 'medium' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Smart Notes */}
                <div className="glass-panel p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#30363d]">
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText size={14} className="text-purple-600 dark:text-purple-400" />
                      Recent Smart Notes
                    </h2>
                    <Link href="/notes" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
                      Open Notes Hub
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  {data.recent_notes.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-600 dark:text-slate-400">
                      No study notes created yet. Click "New Note" to write one!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.recent_notes.map((note) => (
                        <Link
                          key={note.id}
                          href="/notes"
                          className="p-3.5 rounded-lg border border-slate-200 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#1c2128]/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {note.subject && (
                              <span 
                                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mb-1.5"
                                style={{
                                  backgroundColor: `${note.subject.color}15`,
                                  color: note.subject.color,
                                  borderColor: `${note.subject.color}30`
                                }}
                              >
                                {note.subject.name}
                              </span>
                            )}
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {note.title}
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {note.content}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            Updated {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col */}
              <div className="space-y-5">
                {/* Habits */}
                <div className="glass-panel p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#30363d]">
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Flame size={14} className="text-amber-500" />
                      Daily Habits
                    </h2>
                    <Link href="/habits" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
                      Manage
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  {data.habits.habits.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-600 dark:text-slate-400">
                      No habits tracked yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.habits.habits.slice(0, 4).map((habit) => (
                        <div
                          key={habit.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#1c2128]/50 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-slate-900 dark:text-white block truncate">
                              {habit.name}
                            </span>
                            <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-medium mt-0.5">
                              <Flame size={10} />
                              {habit.current_streak}d streak
                            </span>
                          </div>

                          <button
                            onClick={() => handleHabitCheckin(habit.id, habit.completed_today)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                              habit.completed_today
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-[#21262d] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#30363d] hover:bg-slate-100'
                            }`}
                          >
                            {habit.completed_today ? 'Done' : 'Check In'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Resources */}
                <div className="glass-panel p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#30363d]">
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Bookmark size={14} className="text-rose-500" />
                      Resources
                    </h2>
                    <Link href="/resources" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
                      View All
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  {data.recent_resources.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-600 dark:text-slate-400">
                      No resources saved yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.recent_resources.slice(0, 3).map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-[#30363d] bg-slate-50/50 dark:bg-[#1c2128]/50 hover:border-indigo-400 dark:hover:border-indigo-600 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition-colors"
                        >
                          <span className="truncate mr-2 font-medium">{res.title}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-semibold shrink-0">{res.resource_type}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
