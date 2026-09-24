'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { DashboardOverview } from '@/types';
import Link from 'next/link';
import { 
  CheckCircle2, Circle, Flame, FileText, CheckSquare, Sparkles,
  Bookmark, ArrowRight, Clock, Plus, AlertCircle
} from 'lucide-react';
import { SkeletonScorecard, SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

/* Priority badge using warm-neutral status tokens */
const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'sh-badge-danger',
  high:   'sh-badge-warning',
  medium: 'sh-badge-olive',
  low:    'sh-badge-olive',
};

const stagger = {
  container: { transition: { staggerChildren: 0.04 } },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};

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

  useEffect(() => { loadDashboard(); }, []);

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.updateTaskStatus(taskId, newStatus);
      loadDashboard();
    } catch (err) { console.error(err); }
  };

  const handleHabitCheckin = async (habitId: number, completedToday: boolean) => {
    try {
      if (completedToday) {
        await api.deleteCheckinHabit(habitId);
      } else {
        await api.checkinHabit(habitId);
      }
      loadDashboard();
    } catch (err) { console.error(err); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight">
              Welcome back, {data ? data.student_name.split(' ')[0] : 'Student'}
            </h1>
            <p className="text-xs text-[#8D8777] mt-0.5">
              Centralized academic productivity and study overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notes" className="sh-btn-primary px-3 py-1.5 text-xs gap-1.5">
              <Plus size={14} strokeWidth={1.75} />
              <span>New Note</span>
            </Link>
            <Link href="/tasks" className="sh-btn-secondary px-3 py-1.5 text-xs gap-1.5">
              <Plus size={14} strokeWidth={1.75} />
              <span>New Task</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="sh-alert-danger">
            <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonScorecard key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Metric Scorecards — glass, staggered entrance */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
            >
              {[
                {
                  label: 'Pending Tasks',
                  value: data.tasks.pending_count,
                  icon: CheckSquare,
                  sub: data.tasks.urgent_count > 0
                    ? <span className="sh-badge-danger">{data.tasks.urgent_count} Urgent</span>
                    : <span className="text-[11px] text-[#8D8777]">No urgent items</span>,
                },
                {
                  label: 'Habits Done',
                  value: `${data.habits.completed_today_count}/${data.habits.total_habits}`,
                  icon: Flame,
                  sub: <span className="text-[11px] text-[#8D8777]">Today</span>,
                },
                {
                  label: 'Smart Notes',
                  value: data.metrics.total_notes,
                  icon: FileText,
                  sub: <span className="text-[11px] text-[#8D8777]">in {data.metrics.total_subjects} Subjects</span>,
                },
                {
                  label: 'AI Sessions',
                  value: data.metrics.total_ai_interactions,
                  icon: Sparkles,
                  sub: <span className="text-[11px] text-[#8D8777]">Prompts</span>,
                },
              ].map(({ label, value, icon: Icon, sub }) => (
                <motion.div
                  key={label}
                  variants={{
                    initial: { opacity: 0, y: 12 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className="sh-glass rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[#8D8777]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
                    <Icon className="w-4 h-4 text-[#8E9B7A]" strokeWidth={1.75} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#FFFBF4]">{value}</span>
                    {sub}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols */}
              <div className="lg:col-span-2 space-y-5">

                {/* Priority Tasks */}
                <div className="sh-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
                    <h2 className="text-xs font-bold text-[#FFFBF4] flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckSquare size={14} className="text-[#8E9B7A]" strokeWidth={1.75} />
                      Priority Tasks
                    </h2>
                    <Link href="/tasks" className="text-xs text-[#8E9B7A] hover:text-[#D8CFBC] font-medium flex items-center gap-1 transition-colors">
                      View All ({data.tasks.pending_count})
                      <ArrowRight size={12} strokeWidth={1.75} />
                    </Link>
                  </div>

                  {data.tasks.upcoming_tasks.length === 0 ? (
                    <EmptyState
                      icon={CheckSquare}
                      title="No pending tasks"
                      description="Great job staying ahead of your assignments!"
                    />
                  ) : (
                    <div className="space-y-2">
                      {data.tasks.upcoming_tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-lg border border-[#36362F] bg-[#11120D]/40 flex items-center justify-between gap-3 hover:border-[#565449] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="text-[#8D8777] hover:text-[#8E9B7A] shrink-0 transition-colors"
                            >
                              {task.status === 'completed'
                                ? <CheckCircle2 size={16} className="text-[#8E9B7A]" strokeWidth={1.75} />
                                : <Circle size={16} strokeWidth={1.75} />}
                            </button>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-[#D8CFBC] block truncate">{task.title}</span>
                              {task.due_date && (
                                <span className="text-[10px] text-[#8D8777] flex items-center gap-1 mt-0.5">
                                  <Clock size={10} strokeWidth={1.75} />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold shrink-0 ${PRIORITY_BADGE[task.priority] || 'sh-badge-olive'}`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Notes */}
                <div className="sh-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
                    <h2 className="text-xs font-bold text-[#FFFBF4] flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText size={14} className="text-[#8E9B7A]" strokeWidth={1.75} />
                      Recent Smart Notes
                    </h2>
                    <Link href="/notes" className="text-xs text-[#8E9B7A] hover:text-[#D8CFBC] font-medium flex items-center gap-1 transition-colors">
                      Open Notes Hub
                      <ArrowRight size={12} strokeWidth={1.75} />
                    </Link>
                  </div>

                  {data.recent_notes.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No notes yet"
                      description="Click «New Note» to write your first study note."
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.recent_notes.map((note) => (
                        <Link
                          key={note.id}
                          href="/notes"
                          className="p-3.5 rounded-lg border border-[#36362F] bg-[#11120D]/40 hover:border-[#565449] transition-all flex flex-col justify-between"
                        >
                          <div>
                            {note.subject && (
                              <span
                                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mb-1.5"
                                style={{
                                  backgroundColor: `${note.subject.color}15`,
                                  color: note.subject.color,
                                  borderColor: `${note.subject.color}30`,
                                }}
                              >
                                {note.subject.name}
                              </span>
                            )}
                            <h3 className="text-xs font-semibold text-[#FFFBF4] line-clamp-1">{note.title}</h3>
                            <p className="text-[11px] text-[#8D8777] line-clamp-2 mt-1 leading-relaxed">{note.content}</p>
                          </div>
                          <span className="text-[10px] text-[#8D8777] mt-2 block">
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
                <div className="sh-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
                    <h2 className="text-xs font-bold text-[#FFFBF4] flex items-center gap-1.5 uppercase tracking-wider">
                      <Flame size={14} className="text-status-warning" strokeWidth={1.75} />
                      Daily Habits
                    </h2>
                    <Link href="/habits" className="text-xs text-[#8E9B7A] hover:text-[#D8CFBC] font-medium flex items-center gap-1 transition-colors">
                      Manage <ArrowRight size={12} strokeWidth={1.75} />
                    </Link>
                  </div>

                  {data.habits.habits.length === 0 ? (
                    <EmptyState icon={Flame} title="No habits tracked yet" />
                  ) : (
                    <div className="space-y-2">
                      {data.habits.habits.slice(0, 4).map((habit) => (
                        <div
                          key={habit.id}
                          className="p-2.5 rounded-lg border border-[#36362F] bg-[#11120D]/40 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[#FFFBF4] block truncate">{habit.name}</span>
                            <span className="text-[10px] flex items-center gap-0.5 font-medium mt-0.5" style={{ color: '#C4975A' }}>
                              <Flame size={10} strokeWidth={1.75} />
                              {habit.current_streak}d streak
                            </span>
                          </div>
                          <button
                            onClick={() => handleHabitCheckin(habit.id, habit.completed_today)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                              habit.completed_today
                                ? 'sh-badge-sage'
                                : 'sh-btn-secondary px-2 py-1'
                            }`}
                          >
                            {habit.completed_today ? 'Done' : 'Check In'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resources */}
                <div className="sh-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
                    <h2 className="text-xs font-bold text-[#FFFBF4] flex items-center gap-1.5 uppercase tracking-wider">
                      <Bookmark size={14} className="text-[#8E9B7A]" strokeWidth={1.75} />
                      Resources
                    </h2>
                    <Link href="/resources" className="text-xs text-[#8E9B7A] hover:text-[#D8CFBC] font-medium flex items-center gap-1 transition-colors">
                      View All <ArrowRight size={12} strokeWidth={1.75} />
                    </Link>
                  </div>

                  {data.recent_resources.length === 0 ? (
                    <EmptyState icon={Bookmark} title="No resources saved yet" />
                  ) : (
                    <div className="space-y-2">
                      {data.recent_resources.slice(0, 3).map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-lg border border-[#36362F] bg-[#11120D]/40 hover:border-[#565449] flex items-center justify-between text-xs text-[#D8CFBC] transition-colors"
                        >
                          <span className="truncate mr-2 font-medium">{res.title}</span>
                          <span className="sh-badge-olive shrink-0">{res.resource_type}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
