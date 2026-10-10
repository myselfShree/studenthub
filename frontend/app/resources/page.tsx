'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api, API_BASE_URL } from '@/lib/api';
import {
  Plus, Search, ExternalLink, Bookmark, Trash2, X,
  BookOpen, Video, Github, FileText, Link2, BookMarked,
  Image as ImageIcon, Filter, AlertCircle, Play, Upload,
  FileCheck, Download, Eye, Sparkles
} from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import AuthPromptModal from '@/components/AuthPromptModal';
import { useAuth } from '@/context/AuthContext';

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

interface Subject {
  id: number;
  name: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  video:   { label: 'Video Lecture',  icon: <Video size={13} />,      color: 'text-[#C76A5E]', bg: 'bg-[#C76A5E]/10 border-[#C76A5E]/20' },
  github:  { label: 'Code / Repo',    icon: <Github size={13} />,     color: 'text-[#D8CFBC]', bg: 'bg-[#24241E] border-[#36362F]' },
  article: { label: 'Paper / Notes',  icon: <FileText size={13} />,   color: 'text-[#8E9B7A]', bg: 'bg-[#8E9B7A]/10 border-[#8E9B7A]/20' },
  pdf:     { label: 'PDF Document',   icon: <BookOpen size={13} />,   color: 'text-[#C4975A]', bg: 'bg-[#C4975A]/10 border-[#C4975A]/20' },
  book:    { label: 'Textbook',       icon: <BookMarked size={13} />, color: 'text-[#C4975A]', bg: 'bg-[#C4975A]/10 border-[#C4975A]/20' },
  image:   { label: 'Photo / Diagram',icon: <ImageIcon size={13} />,  color: 'text-[#8E9B7A]', bg: 'bg-[#8E9B7A]/10 border-[#8E9B7A]/20' },
  link:    { label: 'Web Link',       icon: <Link2 size={13} />,      color: 'text-[#D8CFBC]', bg: 'bg-[#24241E] border-[#36362F]' },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

const SAMPLE_GUEST_RESOURCES: Resource[] = [
  {
    id: 101,
    title: 'MIT 6.006: Introduction to Algorithms Lecture Series',
    url: 'https://www.youtube.com/watch?v=ZA-tUyM_y7s',
    description: 'Complete video lecture on asymptotic complexity, divide and conquer, and graph traversal.',
    resource_type: 'video',
    tags: ['algorithms', 'mit', 'dsa'],
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    title: 'Deep Learning & Neural Network Visual Cheatsheet (PDF)',
    url: 'https://raw.githubusercontent.com/afshinea/stanford-cs-229-machine-learning/master/en/cheatsheet-deep-learning.pdf',
    description: 'Stanford CS229 high-yield formulas, backpropagation calculus, and activation functions.',
    resource_type: 'pdf',
    tags: ['ai', 'cheatsheet', 'cs229'],
    created_at: new Date().toISOString(),
  },
  {
    id: 103,
    title: 'Microservices & Distributed Systems Architecture Diagram',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    description: 'Event-driven message queues, load balancers, and persistent database clustering overview.',
    resource_type: 'image',
    tags: ['system-design', 'backend', 'diagram'],
    created_at: new Date().toISOString(),
  },
  {
    id: 104,
    title: 'Awesome Competitive Programming Algorithms Repository',
    url: 'https://github.com/the-algorithms/python',
    description: 'Open source clean implementations of all classic data structures and sorting routines in Python.',
    resource_type: 'github',
    tags: ['github', 'python', 'reference'],
    created_at: new Date().toISOString(),
  },
];

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  } catch {
    return null;
  }
}

function isDirectImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.includes('/files/shared/');
}

function resolveResourceUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const root = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState('save resources');
  const [previewMedia, setPreviewMedia] = useState<{ title: string; type: string; url: string } | null>(null);

  // Form mode: 'link' vs 'upload'
  const [modalMode, setModalMode] = useState<'link' | 'upload'>('link');
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    resource_type: 'video',
    subject_id: '',
    tags: '',
  });

  // File upload state (Strict 30MB limit)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.resource_type = typeFilter;
      if (subjectFilter) params.subject_id = subjectFilter;

      const [res, subs] = await Promise.all([
        api.get('/resources', params),
        api.get('/subjects').catch(() => []),
      ]);

      const list = Array.isArray(res) ? res : [];
      if (list.length === 0 && !user && !search && !typeFilter) {
        setResources(SAMPLE_GUEST_RESOURCES);
      } else {
        setResources(list);
      }
      setSubjects(Array.isArray(subs) ? subs : []);
    } catch {
      if (!user) {
        setResources(SAMPLE_GUEST_RESOURCES);
      } else {
        setError('Failed to load study resources');
      }
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, subjectFilter, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpenAdd = () => {
    if (!user) {
      setAuthPromptAction('upload files and save learning resources');
      setAuthPromptOpen(true);
      return;
    }
    setError('');
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 30MB limit check (30 * 1024 * 1024 bytes)
    const MAX_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${actualMB}MB) exceeds the maximum allowed limit of 30MB.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    setSelectedFile(file);
    if (!form.title.trim()) {
      // Auto-populate title from clean filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setForm((prev) => ({ ...prev, title: cleanName }));
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!form.title.trim() || !form.url.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        url: form.url.trim(),
        resource_type: form.resource_type,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.subject_id) payload.subject_id = parseInt(form.subject_id);
      if (form.tags.trim()) {
        payload.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }

      await api.post('/resources', payload);
      setShowModal(false);
      setForm({ title: '', url: '', description: '', resource_type: 'video', subject_id: '', tags: '' });
      setSelectedFile(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!selectedFile) {
      setError('Please choose a Photo or PDF file to upload.');
      return;
    }

    // Double check 30MB limit
    if (selectedFile.size > 30 * 1024 * 1024) {
      setError('File exceeds strict 30MB limit.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (form.title.trim()) formData.append('title', form.title.trim());
      if (form.subject_id) formData.append('subject_id', form.subject_id);
      if (form.description.trim()) formData.append('notes', form.description.trim());

      await api.upload('/resources/upload', formData);
      setShowModal(false);
      setSelectedFile(null);
      setForm({ title: '', url: '', description: '', resource_type: 'video', subject_id: '', tags: '' });
      fetchAll();
    } catch (err: any) {
      setError(err.message || 'Failed to upload resource. Please verify size is under 30MB.');
    } finally {
      setSubmitting(false);
      setUploadProgress(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) {
      setAuthPromptAction('manage or delete resources');
      setAuthPromptOpen(true);
      return;
    }
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight font-display">Academic Resource Hub</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8E9B7A]/15 text-[#8E9B7A] border border-[#8E9B7A]/30">
                Max 30MB Direct Upload
              </span>
            </div>
            <p className="text-[#8D8777] text-xs mt-0.5">
              Upload study PDFs, formula photos, lecture links, and GitHub repositories with embedded media preview
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, paper, book, or formula..."
              className="w-full bg-transparent text-xs text-[#FFFBF4] placeholder-[#8D8777] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {['', ...ALL_TYPES].map((type) => {
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
                  ) : (
                    'All Resources'
                  )}
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
            description="Upload academic photo diagrams, textbook PDFs (up to 30MB), or bookmark YouTube lecture links."
            action={{
              label: 'Add First Resource',
              onClick: handleOpenAdd,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const cfg = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.link;
              const subject = subjects.find((s) => s.id === resource.subject_id);
              const ytEmbed = getYouTubeEmbedUrl(resource.url);
              const isImg = isDirectImageUrl(resource.url) || resource.resource_type === 'image';
              const isPdf = resource.resource_type === 'pdf' || resource.url.toLowerCase().endsWith('.pdf');
              const resolvedUrl = resolveResourceUrl(resource.url);

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
                          <h3 className="text-xs font-semibold text-[#FFFBF4] leading-tight truncate">
                            {resource.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[#8D8777] uppercase font-mono">{cfg.label}</span>
                            {subject && (
                              <>
                                <span className="text-[10px] text-[#565449]">&middot;</span>
                                <span className="text-[10px] text-[#8E9B7A] font-medium truncate">{subject.name}</span>
                              </>
                            )}
                          </div>
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
                        onClick={() => setPreviewMedia({ title: resource.title, type: 'image', url: resolvedUrl })}
                        className="relative rounded-lg overflow-hidden border border-[#36362F] h-36 bg-[#11120D] my-2.5 cursor-pointer group/img"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvedUrl}
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#FFFBF4]">
                          <Eye size={14} />
                          <span>Click to Inspect Full Photo</span>
                        </div>
                      </div>
                    )}

                    {!ytEmbed && isPdf && (
                      <div className="rounded-lg border border-[#C4975A]/25 bg-[#C4975A]/10 p-3 my-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen size={18} className="text-[#C4975A] shrink-0" strokeWidth={1.75} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#FFFBF4] truncate">{resource.title}</p>
                            <p className="text-[10px] text-[#C4975A]">Academic PDF Document (Max 30MB)</p>
                          </div>
                        </div>
                        <a
                          href={resolvedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-[#24241E] hover:bg-[#36362F] border border-[#36362F] text-[11px] font-medium text-[#FFFBF4] shrink-0 flex items-center gap-1"
                        >
                          <span>Open PDF</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    {resource.description && (
                      <p className="text-xs text-[#8D8777] line-clamp-2 mt-2 leading-relaxed">
                        {resource.description}
                      </p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {resource.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#11120D] text-[#8D8777] border border-[#36362F]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#36362F] flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-[#565449]">
                      {new Date(resource.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#8E9B7A] hover:text-[#FFFBF4] transition-colors font-medium"
                    >
                      <span>{isPdf ? 'Download / View PDF' : isImg ? 'View Full Image' : 'Open Link'}</span>
                      <ExternalLink size={12} strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add Resource (Link OR Photo / PDF Upload) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg sh-card rounded-2xl p-6 border border-[#36362F] shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#36362F] mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#FFFBF4] font-display">Add Learning Resource</h2>
                  <p className="text-xs text-[#8D8777]">Save reference URLs or upload academic PDFs & photos (max 30MB)</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#8D8777] hover:text-[#FFFBF4] hover:bg-[#24241E]"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#11120D] border border-[#36362F] mb-4">
                <button
                  type="button"
                  onClick={() => { setModalMode('link'); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    modalMode === 'link'
                      ? 'bg-[#24241E] text-[#FFFBF4] shadow border border-[#565449]'
                      : 'text-[#8D8777] hover:text-[#D8CFBC]'
                  }`}
                >
                  <Link2 size={13} strokeWidth={2} />
                  <span>Bookmark Web Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setModalMode('upload'); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    modalMode === 'upload'
                      ? 'bg-[#282F24] text-[#8E9B7A] shadow border border-[#8E9B7A]/40'
                      : 'text-[#8D8777] hover:text-[#D8CFBC]'
                  }`}
                >
                  <Upload size={13} strokeWidth={2} />
                  <span>Upload Photo or PDF (≤ 30MB)</span>
                </button>
              </div>

              {error && (
                <div className="sh-alert-danger mb-4">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tab 1: Bookmark Web Link Form */}
              {modalMode === 'link' && (
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                      Resource Title <span className="text-[#C76A5E]">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Distributed Consensus in Paxos & Raft"
                      required
                      className="sh-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                      Web URL / YouTube / GitHub Link <span className="text-[#C76A5E]">*</span>
                    </label>
                    <input
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                      required
                      className="sh-input w-full font-mono text-xs"
                    />
                    <p className="text-[10px] text-[#8D8777] mt-1">
                      Tip: YouTube links and image URLs automatically render embedded playable previews.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1.5">Resource Format</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TYPES.map((type) => {
                        const cfg = TYPE_CONFIG[type];
                        const isSelected = form.resource_type === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm({ ...form, resource_type: type })}
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
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      placeholder="Key concepts covered, timestamps, or summary notes..."
                      className="sh-input resize-none w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Subject Course</label>
                      <select
                        value={form.subject_id}
                        onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                        className="sh-select w-full"
                      >
                        <option value="">None / General</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Tags</label>
                      <input
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="algorithms, exam-1"
                        className="sh-input w-full"
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
                      {submitting ? 'Saving...' : 'Bookmark Resource'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Upload Photo or PDF (Strict 30MB Limit) */}
              {modalMode === 'upload' && (
                <form onSubmit={handleUploadFile} className="space-y-4">
                  {/* File Dropzone */}
                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1.5">
                      Select File <span className="text-[#C76A5E]">*</span> (PDF or Image, strictly Max 30MB)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resource-file-upload"
                    />
                    <label
                      htmlFor="resource-file-upload"
                      className="border-2 border-dashed border-[#36362F] hover:border-[#8E9B7A] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#11120D] hover:bg-[#181913]"
                    >
                      {selectedFile ? (
                        <div className="space-y-1.5 flex flex-col items-center">
                          <FileCheck size={28} className="text-[#8E9B7A]" strokeWidth={2} />
                          <p className="text-xs font-semibold text-[#FFFBF4] max-w-[280px] truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-[#8E9B7A]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Valid (Limit: 30MB)
                          </p>
                          <span className="text-[10px] text-[#8D8777] underline mt-1">Click to replace file</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col items-center">
                          <Upload size={24} className="text-[#8D8777]" strokeWidth={1.75} />
                          <p className="text-xs font-medium text-[#FFFBF4]">
                            Click to select Photo or PDF document
                          </p>
                          <p className="text-[11px] text-[#8D8777]">
                            Supports .pdf, .png, .jpg, .webp (Strict max size: <strong className="text-[#D8CFBC]">30 MB</strong>)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1">
                      Resource Title <span className="text-[#C76A5E]">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Operating Systems Cheat Sheet or Architecture Diagram"
                      required
                      className="sh-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Subject Course (Optional)</label>
                    <select
                      value={form.subject_id}
                      onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                      className="sh-select w-full"
                    >
                      <option value="">None / General</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D8CFBC] mb-1">Notes / Description (Optional)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      placeholder="Chapters covered, formulas to memorize, or diagram details..."
                      className="sh-input resize-none w-full"
                    />
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
                      disabled={submitting || !selectedFile}
                      className="sh-btn-primary flex-1 disabled:opacity-50"
                    >
                      {uploadProgress ? 'Uploading (Under 30MB)...' : 'Upload Resource (Max 30MB)'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Lightbox Image Preview Modal */}
        {previewMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setPreviewMedia(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-2 mb-2 text-[#FFFBF4] border-b border-[#36362F]">
                <span className="text-xs font-semibold truncate max-w-md">{previewMedia.title}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4]"
                    title="Download original file"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => setPreviewMedia(null)}
                    className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                className="max-h-[80vh] w-auto rounded-lg object-contain border border-[#36362F]"
              />
            </div>
          </div>
        )}

        {/* Guest Auth Prompt Modal */}
        <AuthPromptModal
          isOpen={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign Up to Save Resources"
          message={`Create an account or log in to ${authPromptAction}. Your photos, PDFs, and bookmarks will be securely synced across your devices.`}
        />
      </div>
    </AppLayout>
  );
}
