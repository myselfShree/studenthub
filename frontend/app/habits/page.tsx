'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Flame, Plus, CheckCircle2, Circle, Trash2, X,
  TrendingUp, Clock, Save, BarChart3, AlertCircle, PenLine,
  Calendar, Table, BookOpen, Download, Search, Check,
  ChevronLeft, ChevronRight, Sparkles, Filter, ExternalLink
} from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import AuthPromptModal from '@/components/AuthPromptModal';
import { useAuth } from '@/context/AuthContext';
import { DailyJournal } from '@/types';

interface Habit {
  id: number;
  user_id?: number;
  name: string;
  description?: string | null;
  target_frequency: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completed_today: boolean;
  recent_history: string[]; // completed dates e.g. ['2026-10-10', '2026-10-09']
  created_at: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  completed: boolean;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: '1', time: '07:00 AM', title: 'Morning Focus & Deep Study Block', completed: false },
  { id: '2', time: '10:30 AM', title: 'Core Subject Concepts & Lecture Notes', completed: false },
  { id: '3', time: '02:00 PM', title: 'Problem Solving & Assignment Practice', completed: false },
  { id: '4', time: '05:30 PM', title: 'Active Recall & Flashcard Revision', completed: false },
  { id: '5', time: '09:00 PM', title: 'Daily 3-Point Review & Tomorrow Planning', completed: false },
];

const SAMPLE_GUEST_HABITS: Habit[] = [
  {
    id: 1,
    name: 'Solve 2 DSA Algorithm Problems',
    description: 'Practice trees, graphs, dynamic programming.',
    target_frequency: 'daily',
    current_streak: 5,
    longest_streak: 12,
    total_completions: 24,
    completed_today: true,
    recent_history: [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: '30 Mins Coding / Project Development',
    description: 'Work on full-stack web applications and APIs.',
    target_frequency: 'daily',
    current_streak: 8,
    longest_streak: 15,
    total_completions: 35,
    completed_today: false,
    recent_history: [
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Review Daily Notes & Flashcards',
    description: 'Active recall for college subjects.',
    target_frequency: 'daily',
    current_streak: 4,
    longest_streak: 9,
    total_completions: 18,
    completed_today: true,
    recent_history: [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    ],
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_GUEST_JOURNALS: DailyJournal[] = [
  {
    id: 1,
    entry_date: new Date().toISOString().split('T')[0],
    point_win: 'Solved 2 Medium LeetCode Dynamic Programming problems without looking at solutions.',
    point_insight: 'Understood bottom-up tabulation space optimization from O(N) to O(1).',
    point_improvement: 'Start the morning deep study block before 8 AM instead of procrastinating.',
  },
  {
    id: 2,
    entry_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    point_win: 'Completed Database Normalization 1NF to BCNF notes and revision cards.',
    point_insight: 'Functional dependencies determine candidate keys and lossless joins.',
    point_improvement: 'Sleep by 11:30 PM to maintain high cognitive alertness.',
  },
  {
    id: 3,
    entry_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    point_win: 'Finished Operating Systems virtual memory paging assignment ahead of schedule.',
    point_insight: 'TLB miss penalty vs page fault page-in cost in modern multi-core systems.',
    point_improvement: 'Limit social media phone time during 2 PM study slot.',
  },
];

export default function HabitsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'routine' | 'monthly_sheet' | 'journal_archive'>('routine');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalHistory, setJournalHistory] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', target_frequency: 'daily' });
  const [error, setError] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState('track habits');

  // Daily Schedule state (persisted per date in localStorage)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [newScheduleTime, setNewScheduleTime] = useState('08:00 AM');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  // 3-Point Journaling state
  const [journal, setJournal] = useState<DailyJournal>({
    entry_date: todayStr,
    point_win: '',
    point_insight: '',
    point_improvement: '',
  });
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalSavedMsg, setJournalSavedMsg] = useState(false);

  // Monthly Sheet State
  const now = new Date();
  const [sheetYear, setSheetYear] = useState<number>(now.getFullYear());
  const [sheetMonth, setSheetMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [tableFilter, setTableFilter] = useState<'all' | 'consistent' | 'skipped'>('all');
  const [journalSearch, setJournalSearch] = useState('');
  const [viewJournalModal, setViewJournalModal] = useState<DailyJournal | null>(null);

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    try {
      const data = await api.get('/habits');
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0 && !user) {
        setHabits(SAMPLE_GUEST_HABITS);
      } else {
        setHabits(list);
      }
    } catch {
      if (!user) {
        setHabits(SAMPLE_GUEST_HABITS);
      } else {
        setError('Failed to load habits');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch journal for date
  const fetchJournalForDate = useCallback(async (dateStr: string) => {
    try {
      const data = await api.get('/journal/today', { entry_date: dateStr });
      if (data && (data.point_win || data.point_insight || data.point_improvement)) {
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
      // Guest fallback or empty
      if (!user) {
        const found = SAMPLE_GUEST_JOURNALS.find((j) => j.entry_date === dateStr);
        if (found) {
          setJournal(found);
          return;
        }
      }
      setJournal({
        entry_date: dateStr,
        point_win: '',
        point_insight: '',
        point_improvement: '',
      });
    }
  }, [user]);

  // Fetch journal history
  const fetchJournalHistory = useCallback(async () => {
    try {
      const data = await api.get('/journal/history', { limit: '90' });
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0 && !user) {
        setJournalHistory(SAMPLE_GUEST_JOURNALS);
      } else {
        setJournalHistory(list);
      }
    } catch {
      if (!user) {
        setJournalHistory(SAMPLE_GUEST_JOURNALS);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
    fetchJournalHistory();
  }, [fetchHabits, fetchJournalHistory]);

  useEffect(() => {
    fetchJournalForDate(selectedDate);

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
  }, [selectedDate, fetchJournalForDate]);

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
    if (!user) {
      setAuthPromptAction('create custom habits');
      setAuthPromptOpen(true);
      return;
    }
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
    if (!user) {
      setAuthPromptAction('record habit check-ins and build streaks');
      setAuthPromptOpen(true);
      return;
    }
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
    if (!user) {
      setAuthPromptAction('delete habits');
      setAuthPromptOpen(true);
      return;
    }
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
    if (!user) {
      setAuthPromptAction('save your daily 3-point reflections');
      setAuthPromptOpen(true);
      return;
    }
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
      fetchJournalHistory();
    } catch {
      setError('Failed to save daily reflection');
    } finally {
      setSavingJournal(false);
    }
  };

  // Calculations for Today
  const totalCompletedHabits = habits.filter((h) => h.completed_today).length;
  const completedScheduleCount = schedule.filter((s) => s.completed).length;
  const scheduleRate = schedule.length > 0 ? Math.round((completedScheduleCount / schedule.length) * 100) : 0;
  const habitRate = habits.length > 0 ? Math.round((totalCompletedHabits / habits.length) * 100) : 0;
  const overallScore = Math.round((scheduleRate + (habits.length > 0 ? habitRate : scheduleRate)) / (habits.length > 0 ? 2 : 1));
  const maxStreak = habits.reduce((a, b) => Math.max(a, b.current_streak), 0);

  // Generate All Days for the Chosen Month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(sheetYear, sheetMonth + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(sheetYear, sheetMonth, day);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Find journal entry for this date
      const journalEntry = journalHistory.find((j) => j.entry_date === dateStr);

      // Check habits completed on this date
      const completedHabitNames: string[] = [];
      habits.forEach((h) => {
        if (Array.isArray(h.recent_history) && h.recent_history.includes(dateStr)) {
          completedHabitNames.push(h.name);
        }
      });

      // Check schedule for this date
      let schedCount = 0;
      let schedTotal = DEFAULT_SCHEDULE.length;
      if (dateStr === todayStr) {
        schedCount = schedule.filter((s) => s.completed).length;
        schedTotal = schedule.length;
      } else {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(`studenthub_schedule_${dateStr}`) : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              schedCount = parsed.filter((s: any) => s.completed).length;
              schedTotal = parsed.length;
            }
          } catch {}
        }
      }

      // Calculate Day Consistency Score
      const hasJournal = Boolean(journalEntry && (journalEntry.point_win || journalEntry.point_insight));
      const journalScore = hasJournal ? 40 : 0;
      const habitScore = habits.length > 0 ? Math.round((completedHabitNames.length / habits.length) * 40) : (hasJournal ? 40 : 0);
      const scheduleScore = schedTotal > 0 ? Math.round((schedCount / schedTotal) * 20) : 0;
      const dayScore = Math.min(100, journalScore + habitScore + scheduleScore);

      // Status Badge
      let status: 'consistent' | 'partial' | 'skipped' = 'skipped';
      if (dayScore >= 70 || (hasJournal && completedHabitNames.length > 0)) {
        status = 'consistent';
      } else if (dayScore >= 35 || hasJournal || completedHabitNames.length > 0 || schedCount > 0) {
        status = 'partial';
      }

      days.push({
        dayNumber: day,
        dateStr,
        dayName,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        journalEntry,
        completedHabits: completedHabitNames,
        scheduleCompleted: schedCount,
        scheduleTotal: schedTotal,
        dayScore,
        status,
      });
    }
    return days;
  }, [sheetYear, sheetMonth, journalHistory, habits, schedule, todayStr]);

  // Filtered days for Excel Sheet
  const filteredDays = useMemo(() => {
    return daysInMonth.filter((d) => {
      if (d.isFuture) return false;
      if (tableFilter === 'consistent') return d.status === 'consistent';
      if (tableFilter === 'skipped') return d.status === 'skipped';
      return true;
    });
  }, [daysInMonth, tableFilter]);

  // Monthly KPI Aggregations
  const monthStats = useMemo(() => {
    const pastDays = daysInMonth.filter((d) => !d.isFuture);
    if (pastDays.length === 0) {
      return { consistencyRate: 0, consistentDays: 0, skippedDays: 0, journalsLogged: 0, habitsChecked: 0 };
    }
    const consistentDays = pastDays.filter((d) => d.status === 'consistent').length;
    const skippedDays = pastDays.filter((d) => d.status === 'skipped').length;
    const journalsLogged = pastDays.filter((d) => d.journalEntry && (d.journalEntry.point_win || d.journalEntry.point_insight)).length;
    const habitsChecked = pastDays.reduce((acc, d) => acc + d.completedHabits.length, 0);
    const avgScore = Math.round(pastDays.reduce((acc, d) => acc + d.dayScore, 0) / pastDays.length);

    return {
      consistencyRate: avgScore,
      consistentDays,
      skippedDays,
      journalsLogged,
      habitsChecked,
    };
  }, [daysInMonth]);

  // Export to Excel / CSV Function
  const exportToCSV = () => {
    const monthName = new Date(sheetYear, sheetMonth).toLocaleString('default', { month: 'long' });
    const filename = `StudentHub_Monthly_Consistency_${monthName}_${sheetYear}.csv`;

    const headers = [
      'Date',
      'Day of Week',
      'Schedule Checklist Progress',
      'Habits Completed Count',
      'Habits List',
      '3-Point Reflection (Win)',
      '3-Point Reflection (Insight)',
      '3-Point Reflection (Tomorrow Goal)',
      'Consistency Status',
      'Daily Score %',
    ];

    const rows = daysInMonth
      .filter((d) => !d.isFuture)
      .map((d) => [
        `"${d.dateStr}"`,
        `"${d.dayName}"`,
        `"${d.scheduleCompleted}/${d.scheduleTotal} (${d.scheduleTotal > 0 ? Math.round((d.scheduleCompleted / d.scheduleTotal) * 100) : 0}%)"`,
        `"${d.completedHabits.length}"`,
        `"${d.completedHabits.join('; ') || 'None'}"`,
        `"${(d.journalEntry?.point_win || '').replace(/"/g, '""')}"`,
        `"${(d.journalEntry?.point_insight || '').replace(/"/g, '""')}"`,
        `"${(d.journalEntry?.point_improvement || '').replace(/"/g, '""')}"`,
        `"${d.status.toUpperCase()}"`,
        `"${d.dayScore}%"`,
      ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Journal Archive Feed
  const filteredJournalFeed = useMemo(() => {
    if (!journalSearch.trim()) return journalHistory;
    const q = journalSearch.toLowerCase();
    return journalHistory.filter(
      (j) =>
        j.entry_date.includes(q) ||
        (j.point_win && j.point_win.toLowerCase().includes(q)) ||
        (j.point_insight && j.point_insight.toLowerCase().includes(q)) ||
        (j.point_improvement && j.point_improvement.toLowerCase().includes(q))
    );
  }, [journalHistory, journalSearch]);

  const monthLabel = new Date(sheetYear, sheetMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight font-display">
              Habits, Daily Routine & Reflections
            </h1>
            <p className="text-[#8D8777] text-xs mt-0.5">
              Maintain daily discipline, analyze monthly consistency tables, and review past 3-point reflections
            </p>
          </div>
          <button
            onClick={() => {
              if (!user) {
                setAuthPromptAction('create custom habits');
                setAuthPromptOpen(true);
                return;
              }
              setShowModal(true);
            }}
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

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#11120D] border border-[#36362F] rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('routine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'routine'
                ? 'bg-[#24241E] text-[#FFFBF4] shadow border border-[#565449]'
                : 'text-[#8D8777] hover:text-[#D8CFBC]'
            }`}
          >
            <Clock size={14} className="text-[#8E9B7A]" />
            <span>Today&apos;s Routine &amp; 3-Point Journal</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_sheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'monthly_sheet'
                ? 'bg-[#282F24] text-[#8E9B7A] shadow border border-[#8E9B7A]/40'
                : 'text-[#8D8777] hover:text-[#D8CFBC]'
            }`}
          >
            <Table size={14} />
            <span>📊 Monthly Consistency Sheet (Excel Table)</span>
          </button>

          <button
            onClick={() => setActiveTab('journal_archive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'journal_archive'
                ? 'bg-[#24241E] text-[#FFFBF4] shadow border border-[#565449]'
                : 'text-[#8D8777] hover:text-[#D8CFBC]'
            }`}
          >
            <BookOpen size={14} className="text-[#C4975A]" />
            <span>📖 Journal Reflections Archive ({journalHistory.length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: TODAY'S ROUTINE, HABITS & 3-POINT JOURNAL
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'routine' && (
          <div className="space-y-6 animate-fade-in">
            {/* 3 Metric Scorecards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Today&apos;s Score</p>
                  <p className="text-2xl font-bold text-[#FFFBF4] mt-1">{overallScore}%</p>
                  <p className="text-[10px] text-[#8D8777] mt-0.5">
                    {completedScheduleCount}/{schedule.length} routine · {totalCompletedHabits}/{habits.length} habits
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/30 text-[#8E9B7A] flex items-center justify-center">
                  <TrendingUp size={18} strokeWidth={1.75} />
                </div>
              </div>

              <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Best Habit Streak</p>
                  <p className="text-2xl font-bold text-[#C4975A] mt-1">
                    {maxStreak} <span className="text-xs text-[#8D8777] font-normal">days</span>
                  </p>
                  <p className="text-[10px] text-[#8D8777] mt-0.5">Consecutive active completion</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C4975A]/10 border border-[#C4975A]/20 text-[#C4975A] flex items-center justify-center">
                  <Flame size={18} strokeWidth={1.75} />
                </div>
              </div>

              <div className="sh-glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">3-Point Journal</p>
                  <p className="text-2xl font-bold text-[#8E9B7A] mt-1">
                    {journal.point_win ? 'Recorded ✅' : 'Pending'}
                  </p>
                  <p className="text-[10px] text-[#8D8777] mt-0.5">
                    {journal.point_win ? 'Daily reflection saved' : 'Reflect on wins & improvements'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/30 text-[#8E9B7A] flex items-center justify-center">
                  <PenLine size={18} strokeWidth={1.75} />
                </div>
              </div>
            </div>

            {/* Date Navigator Bar */}
            <div className="sh-card rounded-xl p-3 flex items-center justify-between border border-[#36362F]">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#8E9B7A]" />
                <span className="text-xs text-[#8D8777]">Viewing routine for date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#11120D] border border-[#36362F] rounded-md px-2.5 py-1 text-xs text-[#FFFBF4] outline-none"
                />
              </div>
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1 rounded-md text-xs bg-[#24241E] text-[#8E9B7A] border border-[#36362F] hover:bg-[#36362F]"
                >
                  Back to Today
                </button>
              )}
            </div>

            {/* Main Content Grid: Checklist on left, Habits & Journal on right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Daily Schedule Checklist */}
              <div className="sh-card rounded-xl p-5 border border-[#36362F] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#36362F]">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#8E9B7A]" />
                    <h2 className="text-sm font-bold text-[#FFFBF4]">Daily Routine Checklist</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8D8777]">
                      {completedScheduleCount}/{schedule.length} Done ({scheduleRate}%)
                    </span>
                    <button
                      onClick={() => setShowAddSchedule(!showAddSchedule)}
                      className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4] hover:bg-[#24241E]"
                      title="Add Routine Item"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Add new schedule item input */}
                {showAddSchedule && (
                  <form onSubmit={addScheduleItem} className="p-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        placeholder="Time (e.g. 04:00 PM)"
                        className="sh-input text-xs w-32 py-1.5"
                      />
                      <input
                        type="text"
                        value={newScheduleTitle}
                        onChange={(e) => setNewScheduleTitle(e.target.value)}
                        placeholder="Study slot title or routine goal..."
                        className="sh-input text-xs flex-1 py-1.5"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddSchedule(false)}
                        className="px-2.5 py-1 text-xs text-[#8D8777] hover:text-[#FFFBF4]"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="sh-btn-sage text-xs py-1 px-3">
                        Add Slot
                      </button>
                    </div>
                  </form>
                )}

                {/* Schedule Items List */}
                <div className="space-y-2">
                  {schedule.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        item.completed
                          ? 'bg-[#282F24]/30 border-[#8E9B7A]/30 text-[#D8CFBC]'
                          : 'bg-[#11120D] border-[#36362F] text-[#FFFBF4]'
                      }`}
                    >
                      <button
                        onClick={() => toggleScheduleItem(item.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 size={16} className="text-[#8E9B7A] shrink-0" />
                        ) : (
                          <Circle size={16} className="text-[#565449] shrink-0" />
                        )}
                        <span className="text-xs font-mono text-[#8D8777] shrink-0">{item.time}</span>
                        <span className={`text-xs truncate ${item.completed ? 'line-through text-[#8D8777]' : ''}`}>
                          {item.title}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteScheduleItem(item.id)}
                        className="p-1 text-[#565449] hover:text-[#C76A5E] transition-colors"
                        title="Delete slot"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Habits Streaks & 3-Point Journal */}
              <div className="space-y-6">
                {/* Active Habits Section */}
                <div className="sh-card rounded-xl p-5 border border-[#36362F] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#36362F]">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-[#C4975A]" />
                      <h2 className="text-sm font-bold text-[#FFFBF4]">Active Habits ({habits.length})</h2>
                    </div>
                    <span className="text-xs text-[#8D8777]">
                      {totalCompletedHabits}/{habits.length} completed
                    </span>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      <SkeletonRow />
                      <SkeletonRow />
                    </div>
                  ) : habits.length === 0 ? (
                    <p className="text-xs text-[#8D8777] text-center py-4">
                      No habits tracked yet. Click &quot;New Habit&quot; above to start.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {habits.map((habit) => (
                        <div
                          key={habit.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#11120D] border border-[#36362F] hover:border-[#565449] transition-all"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-semibold text-[#FFFBF4] truncate">{habit.name}</h3>
                              <span className="flex items-center gap-0.5 text-[10px] text-[#C4975A] font-semibold bg-[#C4975A]/10 px-1.5 py-0.5 rounded border border-[#C4975A]/20">
                                <Flame size={10} />
                                {habit.current_streak}d
                              </span>
                            </div>
                            {habit.description && (
                              <p className="text-[11px] text-[#8D8777] truncate mt-0.5">{habit.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCheckin(habit)}
                              disabled={checkingIn === habit.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                habit.completed_today
                                  ? 'bg-[#282F24] text-[#8E9B7A] border border-[#8E9B7A]/40'
                                  : 'bg-[#24241E] text-[#D8CFBC] hover:bg-[#36362F] border border-[#36362F]'
                              }`}
                            >
                              {habit.completed_today ? <Check size={12} /> : null}
                              <span>{habit.completed_today ? 'Done' : 'Check In'}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="p-1.5 text-[#565449] hover:text-[#C76A5E] transition-colors"
                              title="Delete habit"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3-Point Journal Section */}
                <form onSubmit={handleSaveJournal} className="sh-card rounded-xl p-5 border border-[#36362F] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#36362F]">
                    <div className="flex items-center gap-2">
                      <PenLine size={16} className="text-[#8E9B7A]" />
                      <div>
                        <h2 className="text-sm font-bold text-[#FFFBF4]">Daily 3-Point Reflection</h2>
                        <p className="text-[10px] text-[#8D8777]">Log key progress, concepts learned, and improvements</p>
                      </div>
                    </div>
                    {journalSavedMsg && (
                      <span className="text-xs text-[#8E9B7A] font-semibold flex items-center gap-1 animate-fade-in">
                        <Check size={13} /> Saved!
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                        🏆 1. What was your biggest win / accomplishment today?
                      </label>
                      <input
                        type="text"
                        value={journal.point_win}
                        onChange={(e) => setJournal({ ...journal, point_win: e.target.value })}
                        placeholder="e.g. Mastered Dijkstra algorithm, wrote 300 lines of clean code..."
                        className="sh-input text-xs w-full py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                        💡 2. What new insight or core concept did you learn?
                      </label>
                      <input
                        type="text"
                        value={journal.point_insight}
                        onChange={(e) => setJournal({ ...journal, point_insight: e.target.value })}
                        placeholder="e.g. Understood TCP sliding window flow control mechanism..."
                        className="sh-input text-xs w-full py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                        🎯 3. What will you do better or focus on tomorrow?
                      </label>
                      <input
                        type="text"
                        value={journal.point_improvement}
                        onChange={(e) => setJournal({ ...journal, point_improvement: e.target.value })}
                        placeholder="e.g. Start study block at 8 AM and avoid phone distractions..."
                        className="sh-input text-xs w-full py-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('journal_archive')}
                      className="text-xs text-[#8D8777] hover:text-[#8E9B7A] flex items-center gap-1"
                    >
                      <span>View All Saved Journals</span>
                      <ExternalLink size={12} />
                    </button>
                    <button
                      type="submit"
                      disabled={savingJournal}
                      className="sh-btn-primary py-2 px-4 text-xs font-semibold gap-1.5"
                    >
                      <Save size={13} />
                      <span>{savingJournal ? 'Saving...' : 'Save Reflection'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: MONTHLY CONSISTENCY & ANALYSIS SHEET (EXCEL TABLE DASHBOARD)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'monthly_sheet' && (
          <div className="space-y-6 animate-fade-in">
            {/* Monthly KPI Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="sh-card rounded-xl p-4 border border-[#36362F]">
                <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Month Consistency</p>
                <p className="text-2xl font-bold text-[#8E9B7A] mt-1">{monthStats.consistencyRate}%</p>
                <p className="text-[10px] text-[#8D8777] mt-0.5">Weighted performance</p>
              </div>

              <div className="sh-card rounded-xl p-4 border border-[#36362F]">
                <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Consistent vs Skipped</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-[#FFFBF4]">{monthStats.consistentDays}</span>
                  <span className="text-xs text-[#8E9B7A] font-semibold">Done</span>
                  <span className="text-sm text-[#565449]">/</span>
                  <span className="text-xl font-bold text-[#C76A5E]">{monthStats.skippedDays}</span>
                  <span className="text-xs text-[#C76A5E]">Skipped</span>
                </div>
                <p className="text-[10px] text-[#8D8777] mt-0.5">Calendar active distribution</p>
              </div>

              <div className="sh-card rounded-xl p-4 border border-[#36362F]">
                <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">3-Point Journals Logged</p>
                <p className="text-2xl font-bold text-[#C4975A] mt-1">{monthStats.journalsLogged}</p>
                <p className="text-[10px] text-[#8D8777] mt-0.5">Daily reflections recorded</p>
              </div>

              <div className="sh-card rounded-xl p-4 border border-[#36362F]">
                <p className="text-[11px] font-semibold text-[#8D8777] uppercase tracking-wider">Habit Check-Ins</p>
                <p className="text-2xl font-bold text-[#FFFBF4] mt-1">{monthStats.habitsChecked}</p>
                <p className="text-[10px] text-[#8D8777] mt-0.5">Total completed sessions</p>
              </div>
            </div>

            {/* Controls Bar: Month Picker, Filter buttons & Export to Excel */}
            <div className="sh-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border border-[#36362F]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#D8CFBC]">Month:</span>
                <select
                  value={sheetMonth}
                  onChange={(e) => setSheetMonth(parseInt(e.target.value))}
                  className="sh-select text-xs py-1.5 px-3 bg-[#11120D]"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <option key={m} value={idx}>
                      {m} {sheetYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tableFilter === 'all'
                      ? 'bg-[#FFFBF4] text-[#11120D] font-bold'
                      : 'bg-[#11120D] text-[#8D8777] hover:text-[#FFFBF4] border border-[#36362F]'
                  }`}
                >
                  All Days ({daysInMonth.filter((d) => !d.isFuture).length})
                </button>
                <button
                  onClick={() => setTableFilter('consistent')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tableFilter === 'consistent'
                      ? 'bg-[#282F24] text-[#8E9B7A] border border-[#8E9B7A]/50 font-bold'
                      : 'bg-[#11120D] text-[#8D8777] hover:text-[#FFFBF4] border border-[#36362F]'
                  }`}
                >
                  🔥 Consistent ({monthStats.consistentDays})
                </button>
                <button
                  onClick={() => setTableFilter('skipped')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tableFilter === 'skipped'
                      ? 'bg-[#C76A5E]/20 text-[#C76A5E] border border-[#C76A5E]/40 font-bold'
                      : 'bg-[#11120D] text-[#8D8777] hover:text-[#FFFBF4] border border-[#36362F]'
                  }`}
                >
                  ❌ Skipped ({monthStats.skippedDays})
                </button>
              </div>

              {/* Export to Excel (.csv) Button */}
              <button
                onClick={exportToCSV}
                className="sh-btn-sage text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-semibold"
                title="Download spreadsheet formatted CSV"
              >
                <Download size={13} strokeWidth={2} />
                <span>Export to Excel (.csv)</span>
              </button>
            </div>

            {/* Excel-Style Spreadsheet Table */}
            <div className="sh-card rounded-xl border border-[#36362F] overflow-hidden">
              <div className="p-3 border-b border-[#36362F] bg-[#141510] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table size={15} className="text-[#8E9B7A]" />
                  <span className="text-xs font-bold text-[#FFFBF4]">
                    Consistency Spreadsheet Grid &middot; {monthLabel}
                  </span>
                </div>
                <span className="text-[11px] text-[#8D8777]">
                  Showing {filteredDays.length} evaluated records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#36362F] bg-[#11120D] text-[#8D8777] uppercase text-[10px] font-semibold tracking-wider">
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Date</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Day</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Routine Checklist</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Habits Checked</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50 min-w-[240px]">3-Point Journal Summary</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Status</th>
                      <th className="py-2.5 px-3.5 border-r border-[#36362F]/50">Score</th>
                      <th className="py-2.5 px-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#36362F]/40 font-mono text-[11px]">
                    {filteredDays.map((d) => {
                      const hasJournal = Boolean(d.journalEntry && (d.journalEntry.point_win || d.journalEntry.point_insight));
                      const isConsistent = d.status === 'consistent';
                      const isSkipped = d.status === 'skipped';

                      return (
                        <tr
                          key={d.dateStr}
                          className={`hover:bg-[#1A1B14] transition-colors ${
                            d.isToday ? 'bg-[#282F24]/15' : ''
                          }`}
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 font-semibold text-[#FFFBF4] whitespace-nowrap">
                            {d.dateStr}
                            {d.isToday && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-[#8E9B7A]/20 text-[#8E9B7A] border border-[#8E9B7A]/40 font-sans">
                                Today
                              </span>
                            )}
                          </td>

                          {/* Day of Week */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 text-[#8D8777] whitespace-nowrap">
                            {d.dayName}
                          </td>

                          {/* Routine Checklist */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 text-[#D8CFBC] whitespace-nowrap">
                            <span className="font-semibold">{d.scheduleCompleted}</span>
                            <span className="text-[#8D8777]">/{d.scheduleTotal} slots</span>
                          </td>

                          {/* Habits Checked */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 text-[#D8CFBC] whitespace-nowrap">
                            {d.completedHabits.length > 0 ? (
                              <span className="text-[#8E9B7A] font-semibold">
                                {d.completedHabits.length} checked
                              </span>
                            ) : (
                              <span className="text-[#8D8777]">0 checked</span>
                            )}
                          </td>

                          {/* 3-Point Journal Reflection */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 font-sans text-xs">
                            {hasJournal ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate max-w-[220px] text-[#FFFBF4]" title={d.journalEntry?.point_win}>
                                  🏆 {d.journalEntry?.point_win}
                                </span>
                                <button
                                  onClick={() => d.journalEntry && setViewJournalModal(d.journalEntry)}
                                  className="text-[10px] text-[#8E9B7A] hover:underline shrink-0"
                                >
                                  Read
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#8D8777] italic text-[11px]">
                                ⚠️ No reflection recorded
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 whitespace-nowrap font-sans">
                            {isConsistent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#282F24] text-[#8E9B7A] border border-[#8E9B7A]/40">
                                🔥 Consistent
                              </span>
                            ) : isSkipped ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#C76A5E]/15 text-[#C76A5E] border border-[#C76A5E]/30">
                                ❌ Skipped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#C4975A]/15 text-[#C4975A] border border-[#C4975A]/30">
                                ⚡ Partial
                              </span>
                            )}
                          </td>

                          {/* Score % */}
                          <td className="py-2.5 px-3.5 border-r border-[#36362F]/40 whitespace-nowrap">
                            <span className={`font-bold ${
                              d.dayScore >= 70 ? 'text-[#8E9B7A]' : d.dayScore >= 40 ? 'text-[#C4975A]' : 'text-[#C76A5E]'
                            }`}>
                              {d.dayScore}%
                            </span>
                          </td>

                          {/* Jump to Day Action */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-sans">
                            <button
                              onClick={() => {
                                setSelectedDate(d.dateStr);
                                setActiveTab('routine');
                              }}
                              className="text-[10px] text-[#8E9B7A] hover:text-[#FFFBF4] underline underline-offset-2"
                            >
                              Edit Day
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: 3-POINT JOURNAL REFLECTIONS ARCHIVE
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'journal_archive' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search Bar for Reflections */}
            <div className="sh-card rounded-xl p-3.5 flex items-center justify-between gap-3 border border-[#36362F]">
              <div className="flex items-center gap-2 flex-1 bg-[#11120D] border border-[#36362F] rounded-lg px-3 py-1.5">
                <Search size={14} className="text-[#8D8777]" />
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="Search past reflections, insights, wins, or concepts..."
                  className="w-full bg-transparent text-xs text-[#FFFBF4] placeholder-[#8D8777] outline-none"
                />
              </div>
              <span className="text-xs text-[#8D8777] whitespace-nowrap">
                {filteredJournalFeed.length} entries found
              </span>
            </div>

            {/* Reflections Feed */}
            {filteredJournalFeed.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No journal reflections found"
                description="Save your daily 3-point reflection (Win, Insight, and Tomorrow Focus) to review them here anytime."
                action={{
                  label: "Write Today's Reflection",
                  onClick: () => setActiveTab('routine'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJournalFeed.map((entry) => (
                  <div
                    key={entry.id || entry.entry_date}
                    className="sh-card rounded-xl p-4 border border-[#36362F] hover:border-[#565449] transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-[#8E9B7A]" />
                        <span className="text-xs font-bold text-[#FFFBF4]">{entry.entry_date}</span>
                        {entry.entry_date === todayStr && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#8E9B7A]/20 text-[#8E9B7A] border border-[#8E9B7A]/40">
                            Today
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDate(entry.entry_date);
                          setActiveTab('routine');
                        }}
                        className="text-[10px] text-[#8E9B7A] hover:underline"
                      >
                        Edit in Routine
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {entry.point_win && (
                        <div className="bg-[#11120D] p-2.5 rounded-lg border border-[#36362F]">
                          <p className="text-[10px] font-semibold text-[#8E9B7A] uppercase tracking-wider mb-0.5">
                            🏆 Win of the Day
                          </p>
                          <p className="text-[#FFFBF4] leading-relaxed">{entry.point_win}</p>
                        </div>
                      )}

                      {entry.point_insight && (
                        <div className="bg-[#11120D] p-2.5 rounded-lg border border-[#36362F]">
                          <p className="text-[10px] font-semibold text-[#C4975A] uppercase tracking-wider mb-0.5">
                            💡 Concept / Insight Learned
                          </p>
                          <p className="text-[#FFFBF4] leading-relaxed">{entry.point_insight}</p>
                        </div>
                      )}

                      {entry.point_improvement && (
                        <div className="bg-[#11120D] p-2.5 rounded-lg border border-[#36362F]">
                          <p className="text-[10px] font-semibold text-[#8D8777] uppercase tracking-wider mb-0.5">
                            🎯 Tomorrow&apos;s Focus
                          </p>
                          <p className="text-[#FFFBF4] leading-relaxed">{entry.point_improvement}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: New Habit Creation */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md sh-card rounded-2xl p-6 border border-[#36362F] shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#36362F] mb-4">
                <h2 className="text-base font-bold text-[#FFFBF4] font-display">Create New Daily Habit</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#8D8777] hover:text-[#FFFBF4]"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                    Habit Name <span className="text-[#C76A5E]">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Solve 2 LeetCode Problems, Read 20 Mins"
                    required
                    className="sh-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Description (Optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Target algorithms, books, or notes..."
                    className="sh-input resize-none w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Target Frequency</label>
                  <select
                    value={form.target_frequency}
                    onChange={(e) => setForm({ ...form, target_frequency: e.target.value })}
                    className="sh-select w-full"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only (Mon - Fri)</option>
                    <option value="custom">3x per Week</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
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

        {/* Modal: Full Journal View Popover */}
        {viewJournalModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setViewJournalModal(null)}
          >
            <div
              className="w-full max-w-lg sh-card rounded-2xl p-6 border border-[#36362F] shadow-2xl relative space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#36362F]">
                <div>
                  <h3 className="text-sm font-bold text-[#FFFBF4]">3-Point Reflection</h3>
                  <p className="text-xs text-[#8E9B7A] font-mono">{viewJournalModal.entry_date}</p>
                </div>
                <button
                  onClick={() => setViewJournalModal(null)}
                  className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#11120D] p-3 rounded-xl border border-[#36362F]">
                  <p className="text-[10px] font-bold text-[#8E9B7A] uppercase mb-1">🏆 Win of the Day</p>
                  <p className="text-[#FFFBF4] leading-relaxed">{viewJournalModal.point_win || 'None recorded'}</p>
                </div>

                <div className="bg-[#11120D] p-3 rounded-xl border border-[#36362F]">
                  <p className="text-[10px] font-bold text-[#C4975A] uppercase mb-1">💡 Concept / Insight Learned</p>
                  <p className="text-[#FFFBF4] leading-relaxed">{viewJournalModal.point_insight || 'None recorded'}</p>
                </div>

                <div className="bg-[#11120D] p-3 rounded-xl border border-[#36362F]">
                  <p className="text-[10px] font-bold text-[#8D8777] uppercase mb-1">🎯 Tomorrow&apos;s Focus &amp; Improvement</p>
                  <p className="text-[#FFFBF4] leading-relaxed">{viewJournalModal.point_improvement || 'None recorded'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewJournalModal(null)}
                  className="sh-btn-secondary px-4 py-1.5 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Auth Prompt Modal */}
        <AuthPromptModal
          isOpen={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign Up to Track Habits"
          message={`Create an account to ${authPromptAction}. Your routine checklist, streaks, and reflections will be saved securely.`}
        />
      </div>
    </AppLayout>
  );
}
