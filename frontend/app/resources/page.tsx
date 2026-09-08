'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Plus, Search, ExternalLink, Bookmark, Trash2, X,
  BookOpen, Video, Github, FileText, Link2, BookMarked,
  Loader2, Filter,
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  url: string;
  description?: string;
  resource_type: string;
  subject_id?: number;
  tags?: string[];
  created_at: string;
}

interface Subject { id: number; name: string; }

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  video:   { label:'Video',   icon:<Video size={13}/>,     color:'text-red-400',    bg:'bg-red-500/10 border-red-500/20' },
  github:  { label:'GitHub',  icon:<Github size={13}/>,    color:'text-slate-300',  bg:'bg-slate-700/50 border-slate-600/30' },
  article: { label:'Article', icon:<FileText size={13}/>,  color:'text-sky-400',    bg:'bg-sky-500/10 border-sky-500/20' },
  pdf:     { label:'PDF',     icon:<BookOpen size={13}/>,  color:'text-orange-400', bg:'bg-orange-500/10 border-orange-500/20' },
  book:    { label:'Book',    icon:<BookMarked size={13}/>,color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/20' },
  link:    { label:'Link',    icon:<Link2 size={13}/>,     color:'text-indigo-400', bg:'bg-indigo-500/10 border-indigo-500/20' },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

interface ResourceForm {
  title: string; url: string; description: string;
  resource_type: string; subject_id: string; tags: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [form, setForm] = useState<ResourceForm>({ title:'', url:'', description:'', resource_type:'link', subject_id:'', tags:'' });

  const fetchAll = useCallback(async () => {
    try {
      const params: Record<string,string> = {};
      if (search) params.search = search;
      if (typeFilter) params.resource_type = typeFilter;
      if (subjectFilter) params.subject_id = subjectFilter;
      const [res, subs] = await Promise.all([api.get('/resources', params), api.get('/subjects')]);
      setResources(res); setSubjects(subs);
    } catch { setError('Failed to load resources'); }
    finally { setLoading(false); }
  }, [search, typeFilter, subjectFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string,unknown> = { title:form.title, url:form.url, resource_type:form.resource_type };
      if (form.description) payload.description = form.description;
      if (form.subject_id) payload.subject_id = parseInt(form.subject_id);
      if (form.tags) payload.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/resources', payload);
      setShowModal(false);
      setForm({ title:'', url:'', description:'', resource_type:'link', subject_id:'', tags:'' });
      fetchAll();
    } catch { setError('Failed to save resource'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/resources/${id}`); fetchAll(); }
    catch { setError('Failed to delete resource'); }
  };

  return (
    <AppLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Resource Hub</h1>
            <p className="text-slate-400 text-sm mt-0.5">Curate and organize your study materials</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20">
            <Plus size={16} /> Add Resource
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] glass-panel rounded-xl px-3 py-2 border border-slate-700/30">
            <Search size={14} className="text-slate-500 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 p-1 glass-panel rounded-xl border border-slate-700/30">
              {['', ...ALL_TYPES].map(type => {
                const cfg = type ? TYPE_CONFIG[type] : null;
                return (
                  <button key={type||'all'} onClick={() => setTypeFilter(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${typeFilter===type ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                    {type ? (
                      <span className="flex items-center gap-1">
                        <span className={cfg?.color}>{cfg?.icon}</span>
                        {cfg?.label}
                      </span>
                    ) : 'All'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/40 mb-4"><Bookmark size={32} className="text-slate-500" /></div>
            <p className="text-slate-300 font-medium">No resources found</p>
            <p className="text-slate-500 text-sm mt-1">Add your first study resource</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resources.map(resource => {
              const cfg = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.link;
              const subject = subjects.find(s => s.id === resource.subject_id);
              return (
                <div key={resource.id} className="glass-panel rounded-2xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 group flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <span className={cfg.color}>{cfg.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-tight truncate">{resource.title}</h3>
                        {subject && <p className="text-xs text-indigo-400 mt-0.5">{subject.name}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(resource.id)} className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {resource.description && <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{resource.description}</p>}

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {resource.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-700/30">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                      <ExternalLink size={11} /> Open Resource
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-lg border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add Resource</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Resource title" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">URL *</label>
                <input value={form.url} onChange={e => setForm({...form,url:e.target.value})} placeholder="https://..." type="url" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TYPES.map(type => {
                    const cfg = TYPE_CONFIG[type];
                    return (
                      <button key={type} type="button" onClick={() => setForm({...form,resource_type:type})} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${form.resource_type===type ? `${cfg.bg} ${cfg.color}` : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>
                        <span className={form.resource_type===type ? cfg.color : ''}>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} placeholder="Brief description..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject</label>
                <select value={form.subject_id} onChange={e => setForm({...form,subject_id:e.target.value})} className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors">
                  <option value="">None</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="react, tutorial, beginner" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50">{submitting ? 'Saving...' : 'Add Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
