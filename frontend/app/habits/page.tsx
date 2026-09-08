'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Flame, Plus, CheckCircle2, Circle, Trophy, Trash2, X,
  BarChart2, Target, Loader2, Repeat2,
} from 'lucide-react';

interface Habit {
  id: number;
  name: string;
  description?: string;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  recent_history: boolean[];
  created_at: string;
}

interface HabitForm { name: string; description: string; frequency: string; }

const DAY_LABELS = ['S','M','T','W','T','F','S'];
const FREQ_COLOR: Record<string,string> = {
  daily:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  weekly: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

function MiniCalendar({ history }: { history: boolean[] }) {
  const raw = [...history];
  while (raw.length < 7) raw.unshift(false);
  const last7 = raw.slice(-7);
  return (
    <div className="flex items-center gap-1">
      {last7.map((done, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-slate-600">{DAY_LABELS[i]}</span>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${done ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-orange-500/30' : 'bg-slate-800 border border-slate-700/50'}`}>
            {done && <div className="w-1.5 h-1.5 rounded-full bg-white/80" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingIn, setCheckingIn] = useState<number|null>(null);
  const [form, setForm] = useState<HabitForm>({ name: '', description: '', frequency: 'daily' });
  const [error, setError] = useState('');

  const fetchHabits = useCallback(async () => {
    try { const data = await api.get('/habits'); setHabits(data); }
    catch { setError('Failed to load habits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try { await api.post('/habits', form); setShowModal(false); setForm({ name:'', description:'', frequency:'daily' }); fetchHabits(); }
    catch { setError('Failed to create habit'); }
    finally { setSubmitting(false); }
  };

  const handleCheckin = async (habit: Habit) => {
    setCheckingIn(habit.id);
    try {
      if (habit.completed_today) { await api.delete(`/habits/${habit.id}/checkin`); }
      else { await api.post(`/habits/${habit.id}/checkin`, {}); }
      fetchHabits();
    } catch { setError('Check-in failed'); }
    finally { setCheckingIn(null); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/habits/${id}`); fetchHabits(); }
    catch { setError('Failed to delete habit'); }
  };

  const totalCompleted = habits.filter(h => h.completed_today).length;
  const maxStreak = habits.reduce((a,b) => Math.max(a, b.current_streak), 0);
  const completionRate = habits.length > 0 ? Math.round((totalCompleted / habits.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Habit Tracker</h1>
            <p className="text-slate-400 text-sm mt-0.5">Build consistency, one day at a time</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20">
            <Plus size={16} /> New Habit
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Flame size={14} className="text-amber-400" />, bg: 'bg-amber-500/10', label: 'Best Streak', val: `${maxStreak}`, unit: 'days' },
            { icon: <CheckCircle2 size={14} className="text-emerald-400" />, bg: 'bg-emerald-500/10', label: 'Today', val: `${totalCompleted}/${habits.length}`, unit: 'completed' },
            { icon: <BarChart2 size={14} className="text-violet-400" />, bg: 'bg-violet-500/10', label: 'Rate', val: `${completionRate}%`, unit: null },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                <span className="text-xs text-slate-400 font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.val}</p>
              {s.unit && <p className="text-xs text-slate-500 mt-0.5">{s.unit}</p>}
              {i === 2 && <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{width:`${completionRate}%`}} /></div>}
            </div>
          ))}
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/40 mb-4"><Repeat2 size={32} className="text-slate-500" /></div>
            <p className="text-slate-300 font-medium">No habits yet</p>
            <p className="text-slate-500 text-sm mt-1">Start building your routine</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => (
              <div key={habit.id} className={`glass-panel rounded-2xl p-5 transition-all duration-200 border ${habit.completed_today ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-700/30'}`}>
                <div className="flex items-start gap-4">
                  <button onClick={() => handleCheckin(habit)} disabled={checkingIn === habit.id} className="mt-0.5 flex-shrink-0 transition-all duration-200 hover:scale-110">
                    {checkingIn === habit.id ? <Loader2 size={26} className="animate-spin text-indigo-400" /> : habit.completed_today ? <CheckCircle2 size={26} className="text-emerald-400" /> : <Circle size={26} className="text-slate-600 hover:text-indigo-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-semibold text-sm ${habit.completed_today ? 'text-emerald-300 line-through decoration-emerald-500/40' : 'text-white'}`}>{habit.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${FREQ_COLOR[habit.frequency] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>{habit.frequency}</span>
                      {habit.current_streak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                          <Flame size={11} className="text-amber-400" />
                          <span className="text-xs font-semibold text-amber-300">{habit.current_streak}</span>
                        </div>
                      )}
                    </div>
                    {habit.description && <p className="text-slate-500 text-xs mb-3">{habit.description}</p>}
                    <div className="flex items-center gap-4 flex-wrap">
                      <MiniCalendar history={habit.recent_history} />
                      <div className="flex items-center gap-3 ml-auto">
                        <div className="flex items-center gap-1 text-slate-500 text-xs"><Trophy size={11} className="text-amber-500/60" /><span>Best: {habit.longest_streak}d</span></div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs"><Target size={11} className="text-indigo-500/60" /><span>Streak: {habit.current_streak}d</span></div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(habit.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">New Habit</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Habit Name *</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Morning workout" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Optional details..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Frequency</label>
                <div className="flex gap-2">
                  {[{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'}].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm({...form,frequency:opt.value})} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${form.frequency===opt.value ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Habit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
