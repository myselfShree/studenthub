'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Flame, Plus, CheckCircle2, Circle, Trophy, Trash2, X,
  TrendingUp, Calendar, Target, Loader2, Clock, CheckSquare,
  Sparkles, BookOpen, PenLine, Save, ChevronLeft, ChevronRight,
  BarChart3, AlertCircle
} from 'lucide-react';

interface Habit {
  id: number;
  name: string;
  description?: string;
  target_frequency: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completed_today: boolean;
  recent_history: boolean[];
  created_at: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  completed: boolean;
}

interface JournalEntry {
  id?: number;
  entry_date: string;
  point_win: string;
  point_insight: string;
  point_improvement: string;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: '1', time: '07:00 AM', title: 'Morning Focus & Deep Study Block', completed: false },
  { id: '2', time: '10:30 AM', title: 'Core Subject Concepts & Lecture Notes', completed: false },
  { id: '3', time: '02:00 PM', title: 'Problem Solving & Assignment Practice', completed: false },
  { id: '4', time: '05:30 PM', title: 'Active Recall & Flashcard Revision', completed: false },
  { id: '5', time: '09:00 PM', title: 'Daily 3-Point Review & Tomorrow Planning', completed: false },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', target_frequency: 'daily' });
  const [error, setError] = useState('');

  // Daily Schedule state (persisted per date in localStorage)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [newScheduleTime, setNewScheduleTime] = useState('08:00 AM');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  // 3-Point Journaling state
  const [journal, setJournal] = useState<JournalEntry>({
    entry_date: todayStr,
    point_win: '',
    point_insight: '',
    point_improvement: '',
  });
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalSavedMsg, setJournalSavedMsg] = useState(false);

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    try {
      const data = await api.get('/habits');
      setHabits(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch journal for date
  const fetchJournal = useCallback(async (dateStr: string) => {
    try {
      const data = await api.get('/journal/today', { entry_date: dateStr });
      if (data) {
        setJournal({
          id: data.id,
          entry_date: data.entry_date,
          point_win: data.point_win || '',
          point_insight: data.point_insight || '',
          point_improvement: data.point_improvement || '',
        });
      } else {
        setJournal({
          entry_date: dateStr,
          point_win: '',
          point_insight: '',
          point_improvement: '',
        });
      }
    } catch {
      // Ignore not found
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    fetchJournal(selectedDate);

    // Load schedule from localStorage for selected date
    const savedSchedule = localStorage.getItem(`studenthub_schedule_${selectedDate}`);
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch {
        setSchedule(DEFAULT_SCHEDULE);
      }
    } else {
      setSchedule(DEFAULT_SCHEDULE);
    }
  }, [selectedDate, fetchJournal]);

  const toggleScheduleItem = (id: string) => {
    const updated = schedule.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setSchedule(updated);
    localStorage.setItem(`studenthub_schedule_${selectedDate}`, JSON.stringify(updated));
  };

  const addScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle.trim()) return;
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      time: newScheduleTime,
      title: newScheduleTitle.trim(),
      completed: false,
    };
    const updated = [...schedule, newItem];
    setSchedule(updated);
    localStorage.setItem(`studenthub_schedule_${selectedDate}`, JSON.stringify(updated));
    setNewScheduleTitle('');
    setShowAddSchedule(false);
  };

  const deleteScheduleItem = (id: string) => {
    const updated = schedule.filter((item) => item.id !== id);
    setSchedule(updated);
    localStorage.setItem(`studenthub_schedule_${selectedDate}`, JSON.stringify(updated));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/habits', form);
      setShowModal(false);
      setForm({ name: '', description: '', target_frequency: 'daily' });
      fetchHabits();
    } catch {
      setError('Failed to create habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckin = async (habit: Habit) => {
    setCheckingIn(habit.id);
    try {
      if (habit.completed_today) {
        await api.delete(`/habits/${habit.id}/checkin?completed_date=${todayStr}`);
      } else {
        await api.post(`/habits/${habit.id}/checkin`, { completed_date: todayStr });
      }
      fetchHabits();
    } catch {
      setError('Check-in failed');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch {
      setError('Failed to delete habit');
    }
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJournal(true);
    try {
      await api.post('/journal', {
        entry_date: selectedDate,
        point_win: journal.point_win,
        point_insight: journal.point_insight,
        point_improvement: journal.point_improvement,
      });
      setJournalSavedMsg(true);
      setTimeout(() => setJournalSavedMsg(false), 2500);
    } catch {
      setError('Failed to save daily reflection');
    } finally {
      setSavingJournal(false);
    }
  };

  // Performance calculations
  const totalCompletedHabits = habits.filter((h) => h.completed_today).length;
  const completedScheduleCount = schedule.filter((s) => s.completed).length;
  const scheduleRate = schedule.length > 0 ? Math.round((completedScheduleCount / schedule.length) * 100) : 0;
  const habitRate = habits.length > 0 ? Math.round((totalCompletedHabits / habits.length) * 100) : 0;
  const overallScore = Math.round((scheduleRate + (habits.length > 0 ? habitRate : scheduleRate)) / (habits.length > 0 ? 2 : 1));
  const maxStreak = habits.reduce((a, b) => Math.max(a, b.current_streak), 0);

  // 7-day completion trend data for visual graph
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockWeeklyRates = [70, 85, 60, 90, 75, 80, overallScore];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#30363d]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Routine & Habits Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Manage your daily study schedule, habit streaks, performance graph, and 3-point journal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Daily Performance Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{overallScore}%</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{completedScheduleCount}/{schedule.length} schedule · {totalCompletedHabits}/{habits.length} habits</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Best Habit Streak</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{maxStreak} <span className="text-xs text-slate-600 dark:text-slate-400 font-normal">days</span></p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Active consistency record</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Flame size={18} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">3-Point Journal Status</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {journal.point_win ? 'Recorded' : 'Pending'}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Today's key reflection</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PenLine size={18} />
            </div>
          </div>
        </div>

        {/* Section 1 & 2: Daily Schedule Checklist + Habit Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Schedule Checklist */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Schedule & Checklist</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {completedScheduleCount}/{schedule.length} Done
                  </span>
                  <button
                    onClick={() => setShowAddSchedule(!showAddSchedule)}
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
                    title="Add schedule item"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {showAddSchedule && (
                <form onSubmit={addScheduleItem} className="p-3 mb-3 rounded-lg bg-slate-50 dark:bg-[#1c2128] border border-slate-200 dark:border-[#30363d] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="08:00 AM"
                      value={newScheduleTime}
                      onChange={(e) => setNewScheduleTime(e.target.value)}
                      className="w-24 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Physics Quantum Mechanics Problems"
                      value={newScheduleTitle}
                      onChange={(e) => setNewScheduleTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSchedule(false)}
                      className="px-2.5 py-1 text-xs rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#21262d]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Add Slot
                    </button>
                  </div>
                </form>
              )}

              {/* Schedule Checklist items */}
              <div className="space-y-2">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleScheduleItem(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                      item.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-600 dark:text-slate-400'
                        : 'bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d] hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-shrink-0 text-indigo-600 dark:text-indigo-400"
                    >
                      {item.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} className="text-slate-400 dark:text-slate-500" />
                      )}
                    </button>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#21262d] text-slate-700 dark:text-slate-300 flex-shrink-0">
                      {item.time}
                    </span>

                    <span className={`text-xs font-medium flex-1 ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {item.title}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScheduleItem(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Habit Tracking List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Habits</h2>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {totalCompletedHabits}/{habits.length} Done Today
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-600 dark:text-slate-400">No habits added yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                  >
                    + Add your first habit
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        habit.completed_today
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleCheckin(habit)}
                          disabled={checkingIn === habit.id}
                          className="flex-shrink-0"
                        >
                          {checkingIn === habit.id ? (
                            <Loader2 size={18} className="animate-spin text-indigo-500" />
                          ) : habit.completed_today ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <Circle size={18} className="text-slate-400 hover:text-indigo-500" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${habit.completed_today ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {habit.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                              <Flame size={10} /> {habit.current_streak}d streak
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Best: {habit.longest_streak}d)
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Performance Analytics Graph */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4 gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Performance Analytics & Trend</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block" />
                Completion Rate (%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 pb-2">
            {weekDays.map((day, idx) => {
              const rate = mockWeeklyRates[idx];
              const isToday = idx === 6;
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{rate}%</div>
                  <div className="w-full max-w-[36px] h-32 bg-slate-100 dark:bg-[#0d1117] rounded-lg relative overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-b-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-indigo-400/80 dark:bg-indigo-600/70'
                      }`}
                      style={{ height: `${Math.max(8, rate)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Daily 3-Point Journaling */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4 gap-2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily 3-Point Journal & Reflection</h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Write 3 key reflections everyday to compound learning</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <form onSubmit={handleSaveJournal} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Today's Key Win or Accomplishment</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mastered Dijkstra algorithm and completed all practice exercises"
                value={journal.point_win}
                onChange={(e) => setJournal({ ...journal, point_win: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Core Concept / Insight Learned</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Learned how database indexes use B-Trees to achieve logarithmic lookup times"
                value={journal.point_insight}
                onChange={(e) => setJournal({ ...journal, point_insight: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>One Action to Improve Tomorrow</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Start morning revision 30 minutes earlier and avoid phone distractions"
                value={journal.point_improvement}
                onChange={(e) => setJournal({ ...journal, point_improvement: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                {journalSavedMsg && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} /> Journal saved for {selectedDate}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={savingJournal}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Save size={13} />
                <span>{savingJournal ? 'Saving...' : 'Save Daily Journal'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-panel rounded-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create New Habit</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Habit Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Read 1 Research Paper"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 20 minutes before bedtime"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
