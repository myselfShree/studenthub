'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Flame, Plus, CheckCircle2, Circle, Trash2, X,
  TrendingUp, Clock, Save, BarChart3, AlertCircle, PenLine
} from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

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

  // Calculations
  const totalCompletedHabits = habits.filter((h) => h.completed_today).length;
  const completedScheduleCount = schedule.filter((s) => s.completed).length;
  const scheduleRate = schedule.length > 0 ? Math.round((completedScheduleCount / schedule.length) * 100) : 0;
  const habitRate = habits.length > 0 ? Math.round((totalCompletedHabits / habits.length) * 100) : 0;
  const overallScore = Math.round((scheduleRate + (habits.length > 0 ? habitRate : scheduleRate)) / (habits.length > 0 ? 2 : 1));
  const maxStreak = habits.reduce((a, b) => Math.max(a, b.current_streak), 0);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockWeeklyRates = [70, 85, 60, 90, 75, 80, overallScore];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight font-display">Habit Tracking & Daily Routine</h1>
            <p className="text-[#8D8777] text-xs mt-0.5">Maintain consistency with schedule checklist, streak graphs, and 3-point reflections</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="sh-btn-primary gap-1.5 self-start sm:self-auto"
          >
            <Plus size={15} strokeWidth={2} />
            <span>New Habit</span>
          </button>
        </div>

        {error && (
          <div className="sh-alert-danger">
            <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Metric Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Performance Score</p>
              <p className="text-2xl font-bold text-[#FFFBF4] mt-1">{overallScore}%</p>
              <p className="text-[10px] text-[#8D8777] mt-0.5">{completedScheduleCount}/{schedule.length} slots · {totalCompletedHabits}/{habits.length} habits</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/30 text-[#8E9B7A] flex items-center justify-center">
              <TrendingUp size={18} strokeWidth={1.75} />
            </div>
          </div>

          <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Best Consistency Streak</p>
              <p className="text-2xl font-bold text-[#C4975A] mt-1">{maxStreak} <span className="text-xs text-[#8D8777] font-normal">days</span></p>
              <p className="text-[10px] text-[#8D8777] mt-0.5">Active habit record</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C4975A]/10 border border-[#C4975A]/20 text-[#C4975A] flex items-center justify-center">
              <Flame size={18} strokeWidth={1.75} />
            </div>
          </div>

          <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">3-Point Journal Status</p>
              <p className="text-2xl font-bold text-[#8E9B7A] mt-1">
                {journal.point_win ? 'Recorded' : 'Pending'}
              </p>
              <p className="text-[10px] text-[#8D8777] mt-0.5">{selectedDate === todayStr ? "Today's review" : `Date: ${selectedDate}`}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/30 text-[#8E9B7A] flex items-center justify-center">
              <PenLine size={18} strokeWidth={1.75} />
            </div>
          </div>
        </div>

        {/* Section 1 & 2: Daily Schedule Checklist + Habit Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Schedule Checklist */}
          <div className="lg:col-span-7 space-y-4">
            <div className="sh-card rounded-xl p-5 border border-[#36362F]">
              <div className="flex items-center justify-between pb-3 border-b border-[#36362F] mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#8E9B7A]" strokeWidth={1.75} />
                  <h2 className="text-xs font-bold text-[#FFFBF4] uppercase tracking-wider font-display">Daily Schedule & Checklist</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8D8777] font-medium">
                    {completedScheduleCount}/{schedule.length} Done
                  </span>
                  <button
                    onClick={() => setShowAddSchedule(!showAddSchedule)}
                    className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4] hover:bg-[#24241E] transition-colors"
                    title="Add schedule slot"
                  >
                    <Plus size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {showAddSchedule && (
                <form onSubmit={addScheduleItem} className="p-3 mb-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="08:00 AM"
                      value={newScheduleTime}
                      onChange={(e) => setNewScheduleTime(e.target.value)}
                      className="sh-input w-24"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Physics Quantum Mechanics Practice"
                      value={newScheduleTitle}
                      onChange={(e) => setNewScheduleTitle(e.target.value)}
                      className="sh-input flex-1"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSchedule(false)}
                      className="sh-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="sh-btn-primary"
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
                        ? 'bg-[#282F24]/30 border-[#8E9B7A]/30 text-[#8D8777]'
                        : 'bg-[#11120D]/40 border-[#36362F] hover:border-[#565449] text-[#D8CFBC]'
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-shrink-0 text-[#8E9B7A]"
                    >
                      {item.completed ? (
                        <CheckCircle2 size={18} className="text-[#8E9B7A]" strokeWidth={1.75} />
                      ) : (
                        <Circle size={18} className="text-[#8D8777]" strokeWidth={1.75} />
                      )}
                    </button>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1C1C17] border border-[#36362F] text-[#D8CFBC] flex-shrink-0">
                      {item.time}
                    </span>

                    <span className={`text-xs font-medium flex-1 ${item.completed ? 'line-through text-[#8D8777]' : 'text-[#FFFBF4]'}`}>
                      {item.title}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScheduleItem(item.id);
                      }}
                      className="text-[#8D8777] hover:text-[#C76A5E] p-1 rounded"
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Habit Tracking List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sh-card rounded-xl p-5 border border-[#36362F]">
              <div className="flex items-center justify-between pb-3 border-b border-[#36362F] mb-4">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-[#C4975A]" strokeWidth={1.75} />
                  <h2 className="text-xs font-bold text-[#FFFBF4] uppercase tracking-wider font-display">Daily Habits</h2>
                </div>
                <span className="text-[11px] text-[#8D8777] font-medium">
                  {totalCompletedHabits}/{habits.length} Done Today
                </span>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : habits.length === 0 ? (
                <EmptyState
                  icon={Flame}
                  title="No habits tracked yet"
                  description="Build atomic study routines to compound your daily consistency."
                  action={{
                    label: 'Create Habit',
                    onClick: () => setShowModal(true),
                  }}
                />
              ) : (
                <div className="space-y-2.5">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        habit.completed_today
                          ? 'bg-[#282F24]/30 border-[#8E9B7A]/30'
                          : 'bg-[#11120D]/40 border-[#36362F] hover:border-[#565449]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleCheckin(habit)}
                          disabled={checkingIn === habit.id}
                          className="flex-shrink-0"
                        >
                          {habit.completed_today ? (
                            <CheckCircle2 size={18} className="text-[#8E9B7A]" strokeWidth={1.75} />
                          ) : (
                            <Circle size={18} className="text-[#8D8777] hover:text-[#8E9B7A]" strokeWidth={1.75} />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${habit.completed_today ? 'text-[#8E9B7A]' : 'text-[#FFFBF4]'}`}>
                            {habit.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#C4975A] font-medium flex items-center gap-0.5">
                              <Flame size={10} strokeWidth={1.75} /> {habit.current_streak}d streak
                            </span>
                            <span className="text-[10px] text-[#8D8777]">
                              (Best: {habit.longest_streak}d)
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 rounded text-[#8D8777] hover:text-[#C76A5E] transition-colors"
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Performance Analytics Graph (Sage Intensity Scale) */}
        <div className="sh-card rounded-xl p-5 border border-[#36362F]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#36362F] mb-4 gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#8E9B7A]" strokeWidth={1.75} />
              <h2 className="text-xs font-bold text-[#FFFBF4] uppercase tracking-wider font-display">Weekly Completion Trend</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8D8777]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8E9B7A] inline-block" />
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
                  <div className="text-[11px] font-mono font-medium text-[#D8CFBC]">{rate}%</div>
                  <div className="w-full max-w-[36px] h-32 bg-[#11120D] border border-[#36362F] rounded-lg relative overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-b-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-[#8E9B7A]'
                          : 'bg-[#565449]'
                      }`}
                      style={{ height: `${Math.max(8, rate)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-[#8E9B7A] font-bold' : 'text-[#8D8777]'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Daily 3-Point Journaling */}
        <div className="sh-card rounded-xl p-5 border border-[#36362F]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#36362F] mb-4 gap-2">
            <div className="flex items-center gap-2">
              <PenLine size={16} className="text-[#8E9B7A]" strokeWidth={1.75} />
              <div>
                <h2 className="text-xs font-bold text-[#FFFBF4] uppercase tracking-wider font-display">Daily 3-Point Journal & Reflection</h2>
                <p className="text-[11px] text-[#8D8777]">Write 3 key reflections everyday to compound academic knowledge</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="sh-input text-xs py-1"
              />
            </div>
          </div>

          <form onSubmit={handleSaveJournal} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#D8CFBC] mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#282F24] border border-[#8E9B7A]/40 text-[#8E9B7A] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Today's Key Win or Milestone</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mastered Dijkstra algorithm and completed all practice sets"
                value={journal.point_win}
                onChange={(e) => setJournal({ ...journal, point_win: e.target.value })}
                className="sh-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D8CFBC] mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#282F24] border border-[#8E9B7A]/40 text-[#8E9B7A] flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Core Concept / Insight Learned</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Learned how database indexes use B-Trees for logarithmic lookup"
                value={journal.point_insight}
                onChange={(e) => setJournal({ ...journal, point_insight: e.target.value })}
                className="sh-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D8CFBC] mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-[#282F24] border border-[#8E9B7A]/40 text-[#8E9B7A] flex items-center justify-center text-[10px] font-bold">3</span>
                <span>One Improvement for Tomorrow</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Start morning revision 30 minutes earlier and avoid phone distractions"
                value={journal.point_improvement}
                onChange={(e) => setJournal({ ...journal, point_improvement: e.target.value })}
                className="sh-input"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                {journalSavedMsg && (
                  <span className="text-xs text-[#8E9B7A] font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} strokeWidth={2} /> Journal saved for {selectedDate}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={savingJournal}
                className="sh-btn-primary gap-1.5 disabled:opacity-50"
              >
                <Save size={13} strokeWidth={1.75} />
                <span>{savingJournal ? 'Saving...' : 'Save Reflection'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="sh-glass-strong rounded-2xl p-6 w-full max-w-sm border border-[#36362F] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
              <h2 className="text-sm font-bold text-[#FFFBF4] font-display">Create New Habit</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Habit Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Read 1 Research Paper"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="sh-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 20 minutes before deep work"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="sh-input"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="sh-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="sh-btn-primary flex-1 disabled:opacity-50"
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
