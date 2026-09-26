'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Plus, Search, ExternalLink, Bookmark, Trash2, X,
  BookOpen, Video, Github, FileText, Link2, BookMarked,
  Image as ImageIcon, Filter, AlertCircle, Play
} from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

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
  video:   { label:'Video Lecture', icon:<Video size={13}/>,     color:'text-[#C76A5E]', bg:'bg-[#C76A5E]/10 border-[#C76A5E]/20' },
  github:  { label:'Code / Repo',   icon:<Github size={13}/>,    color:'text-[#D8CFBC]', bg:'bg-[#24241E] border-[#36362F]' },
  article: { label:'Research / Doc',icon:<FileText size={13}/>,  color:'text-[#8E9B7A]', bg:'bg-[#8E9B7A]/10 border-[#8E9B7A]/20' },
  pdf:     { label:'PDF Sheet',     icon:<BookOpen size={13}/>,  color:'text-[#C4975A]', bg:'bg-[#C4975A]/10 border-[#C4975A]/20' },
  book:    { label:'Textbook',      icon:<BookMarked size={13}/>,color:'text-[#C4975A]', bg:'bg-[#C4975A]/10 border-[#C4975A]/20' },
  image:   { label:'Diagram / Photo',icon:<ImageIcon size={13}/>,color:'text-[#8E9B7A]', bg:'bg-[#8E9B7A]/10 border-[#8E9B7A]/20' },
  link:    { label:'Web Link',      icon:<Link2 size={13}/>,     color:'text-[#D8CFBC]', bg:'bg-[#24241E] border-[#36362F]' },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  } catch {
    return null;
  }
}

function isDirectImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url);
}

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
  const [previewMedia, setPreviewMedia] = useState<{ title: string; type: string; url: string } | null>(null);
  const [form, setForm] = useState<ResourceForm>({ title:'', url:'', description:'', resource_type:'video', subject_id:'', tags:'' });

  const fetchAll = useCallback(async () => {
    try {
      const params: Record<string,string> = {};
      if (search) params.search = search;
      if (typeFilter) params.resource_type = typeFilter;
      if (subjectFilter) params.subject_id = subjectFilter;
      const [res, subs] = await Promise.all([api.get('/resources', params), api.get('/subjects')]);
      setResources(Array.isArray(res) ? res : []); 
      setSubjects(Array.isArray(subs) ? subs : []);
    } catch { 
      setError('Failed to load resources'); 
    } finally { 
      setLoading(false); 
    }
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
      setForm({ title:'', url:'', description:'', resource_type:'video', subject_id:'', tags:'' });
      fetchAll();
    } catch { 
      setError('Failed to save resource'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try { 
      await api.delete(`/resources/${id}`); 
      fetchAll(); 
    } catch { 
      setError('Failed to delete resource'); 
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight font-display">Academic Resource Hub</h1>
            <p className="text-[#8D8777] text-xs mt-0.5">Curate, preview, and play videos, diagrams, papers, and GitHub repositories</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="sh-btn-primary gap-1.5 self-start sm:self-auto"
          >
            <Plus size={15} strokeWidth={2} /> 
            <span>Add Resource</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="sh-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border border-[#36362F]">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-[#11120D] border border-[#36362F] rounded-lg px-3 py-1.5">
            <Search size={14} className="text-[#8D8777] flex-shrink-0" strokeWidth={1.75} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by topic, keyword, or course..." 
              className="w-full bg-transparent text-xs text-[#FFFBF4] placeholder-[#8D8777] outline-none" 
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {['', ...ALL_TYPES].map(type => {
              const cfg = type ? TYPE_CONFIG[type] : null;
              const isSelected = typeFilter === type;
              return (
                <button 
                  key={type || 'all'} 
                  onClick={() => setTypeFilter(type)} 
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-[#FFFBF4] text-[#11120D] font-semibold' 
                      : 'bg-[#11120D] text-[#D8CFBC] hover:bg-[#24241E] border border-[#36362F]'
                  }`}
                >
                  {type ? (
                    <>
                      <span>{cfg?.icon}</span>
                      <span>{cfg?.label}</span>
                    </>
                  ) : 'All Resources'}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="sh-alert-danger">
            <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {/* Resources Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sh-card p-4 space-y-3">
                <SkeletonRow />
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No study resources found"
            description="Add YouTube lecture links, GitHub repos, textbook PDFs, or architecture diagrams."
            action={{
              label: 'Add First Resource',
              onClick: () => setShowModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resources.map(resource => {
              const cfg = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.link;
              const subject = subjects.find(s => s.id === resource.subject_id);
              const ytEmbed = getYouTubeEmbedUrl(resource.url);
              const isImg = isDirectImageUrl(resource.url) || resource.resource_type === 'image';

              return (
                <div 
                  key={resource.id} 
                  className="sh-card rounded-xl p-4 border border-[#36362F] hover:border-[#565449] transition-all flex flex-col justify-between group space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2.5 mb-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg border flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                          <span className={cfg.color}>{cfg.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-[#FFFBF4] leading-tight truncate">{resource.title}</h3>
                          {subject && (
                            <span className="text-[10px] text-[#8E9B7A] font-medium block mt-0.5">{subject.name}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(resource.id)} 
                        className="p-1 rounded text-[#8D8777] hover:text-[#C76A5E] hover:bg-[#C76A5E]/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        title="Delete Resource"
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    </div>

                    {/* Embedded Inline Interactive Preview */}
                    {ytEmbed && (
                      <div className="relative rounded-lg overflow-hidden border border-[#36362F] aspect-video bg-black my-2.5">
                        <iframe 
                          src={ytEmbed} 
                          title={resource.title} 
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen 
                        />
                      </div>
                    )}

                    {!ytEmbed && isImg && (
                      <div 
                        onClick={() => setPreviewMedia({ title: resource.title, type: 'image', url: resource.url })}
                        className="relative rounded-lg overflow-hidden border border-[#36362F] max-h-36 bg-[#11120D] my-2.5 cursor-pointer group/img"
                      >
                        <img 
                          src={resource.url} 
                          alt={resource.title} 
                          className="w-full h-36 object-cover group-hover/img:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[#FFFBF4] text-[11px] font-medium transition-opacity">
                          Click to expand
                        </div>
                      </div>
                    )}

                    {resource.description && (
                      <p className="text-[11px] text-[#8D8777] leading-relaxed line-clamp-2">{resource.description}</p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {resource.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-2 py-0.5 rounded bg-[#11120D] text-[#D8CFBC] border border-[#36362F] font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#36362F] flex items-center justify-between">
                    <span className="text-[10px] text-[#8D8777] uppercase font-mono">{resource.resource_type}</span>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs text-[#8E9B7A] hover:text-[#FFFBF4] font-medium transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink size={11} strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Media Lightbox Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="sh-glass-strong rounded-2xl p-4 max-w-2xl w-full border border-[#36362F] relative space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#36362F]">
              <span className="text-xs font-semibold text-[#FFFBF4] truncate">{previewMedia.title}</span>
              <button onClick={() => setPreviewMedia(null)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex justify-center bg-black rounded-lg overflow-hidden max-h-[75vh]">
              <img src={previewMedia.url} alt={previewMedia.title} className="object-contain max-h-[70vh] w-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative sh-glass-strong rounded-2xl p-6 w-full max-w-lg border border-[#36362F] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#36362F]">
              <h2 className="text-sm font-bold text-[#FFFBF4] font-display">Add Academic Resource</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Resource Title *</label>
                <input 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  placeholder="e.g. MIT 18.06 Linear Algebra Lecture 1" 
                  className="sh-input" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1">URL (YouTube / Direct Image / GitHub / Docs) *</label>
                <input 
                  value={form.url} 
                  onChange={e => setForm({...form, url: e.target.value})} 
                  placeholder="https://www.youtube.com/watch?v=... or https://...image.png" 
                  type="url" 
                  className="sh-input" 
                  required 
                />
                <p className="text-[10px] text-[#8D8777] mt-1">
                  Tip: YouTube links and image URLs will automatically render playable videos and interactive diagram previews!
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1.5">Resource Format</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TYPES.map(type => {
                    const cfg = TYPE_CONFIG[type];
                    const isSelected = form.resource_type === type;
                    return (
                      <button 
                        key={type} 
                        type="button" 
                        onClick={() => setForm({...form, resource_type: type})} 
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected 
                            ? `${cfg.bg} ${cfg.color} border-[#8E9B7A]` 
                            : 'bg-[#11120D] border-[#36362F] text-[#8D8777] hover:border-[#565449]'
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Description (Optional)</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  rows={2} 
                  placeholder="Key concepts covered, timestamps, or summary..." 
                  className="sh-input resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Subject Course</label>
                  <select 
                    value={form.subject_id} 
                    onChange={e => setForm({...form, subject_id: e.target.value})} 
                    className="sh-select w-full"
                  >
                    <option value="">None / General</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Tags</label>
                  <input 
                    value={form.tags} 
                    onChange={e => setForm({...form, tags: e.target.value})} 
                    placeholder="linear-algebra, exam1" 
                    className="sh-input" 
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
