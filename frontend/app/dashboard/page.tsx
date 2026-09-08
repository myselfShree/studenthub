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
  BookOpen,
  Calendar,
  AlertCircle,
  Plus,
  Loader2
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
      <div className="space-y-8">
        {/* Top Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Welcome back, {data ? data.student_name.split(' ')[0] : 'Student'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Here is your centralized academic productivity and study overview.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/notes"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Note
            </Link>
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading live student metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            {/* Metric Scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending Tasks</span>
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{data.tasks.pending_count}</span>
                  {data.tasks.urgent_count > 0 && (
                    <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                      {data.tasks.urgent_count} Urgent
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Habit Completed</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    {data.habits.completed_today_count} / {data.habits.total_habits}
                  </span>
                  <span className="text-[11px] text-slate-400">Today</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Smart Notes</span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{data.metrics.total_notes}</span>
                  <span className="text-[11px] text-slate-400">in {data.metrics.total_subjects} Subjects</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Study Sessions</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{data.metrics.total_ai_interactions}</span>
                  <span className="text-[11px] text-slate-400">Interactions</span>
                </div>
              </div>
            </div>

            {/* Main Content Split (Tasks & Habits) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Today's Tasks + Recent Notes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Tasks */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      Priority Assignments & Tasks
                    </h2>
                    <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                      View All ({data.tasks.pending_count})
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {data.tasks.upcoming_tasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No pending tasks right now. Great job staying ahead!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.tasks.upcoming_tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-200 block truncate">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            task.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            task.priority === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-slate-700/30 text-slate-400 border-slate-700'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Smart Notes */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Recent Smart Notes
                    </h2>
                    <Link href="/notes" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                      Open Notes Hub
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {data.recent_notes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No study notes created yet. Click "New Note" above to write your first note!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.recent_notes.map((note) => (
                        <Link
                          key={note.id}
                          href="/notes"
                          className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {note.subject && (
                              <span 
                                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-2"
                                style={{
                                  backgroundColor: `${note.subject.color}15`,
                                  color: note.subject.color,
                                  borderColor: `${note.subject.color}30`
                                }}
                              >
                                {note.subject.name}
                              </span>
                            )}
                            <h3 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {note.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {note.content}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-3 block">
                            Updated {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Daily Habits & Quick Resources */}
              <div className="space-y-6">
                {/* Habits */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Daily Study Habits
                    </h2>
                    <Link href="/habits" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {data.habits.habits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No habits tracked. Start building consistency!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.habits.habits.slice(0, 4).map((habit) => (
                        <div
                          key={habit.id}
                          className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-200 block truncate">
                              {habit.name}
                            </span>
                            <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold mt-0.5">
                              <Flame className="w-3 h-3" />
                              {habit.current_streak} Day Streak
                            </span>
                          </div>

                          <button
                            onClick={() => handleHabitCheckin(habit.id, habit.completed_today)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              habit.completed_today
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
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
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-rose-400" />
                      Study Resources
                    </h2>
                    <Link href="/resources" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                      View All
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {data.recent_resources.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No resources saved yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.recent_resources.slice(0, 3).map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/30 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
                        >
                          <span className="truncate mr-2 font-medium">{res.title}</span>
                          <span className="text-[10px] text-indigo-400 uppercase font-bold shrink-0">{res.resource_type}</span>
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
