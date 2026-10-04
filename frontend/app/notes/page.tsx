'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { Note, Subject, AISummaryResponse, AIKeyPointsResponse, AIQuizResponse, AIExplainResponse } from '@/types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Check, 
  Copy, 
  X, 
  FileText,
  Loader2,
  Save,
  BrainCircuit,
  AlertCircle,
  Send,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Note in Editor
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState<number | null>(null);

  // New Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#8E9B7A');

  // AI Drawer State
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [aiTab, setAiTab] = useState<'summarize' | 'keypoints' | 'quiz' | 'explain' | 'chat'>('summarize');
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [keyPointsData, setKeyPointsData] = useState<AIKeyPointsResponse | null>(null);
  const [quizData, setQuizData] = useState<AIQuizResponse | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [explainTopic, setExplainTopic] = useState('');
  const [explainData, setExplainData] = useState<AIExplainResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Data
  const loadData = async () => {
    try {
      const [notesRes, subjectsRes] = await Promise.all([
        api.getNotes({
          subject_id: selectedSubjectId || undefined,
          search: searchQuery || undefined,
        }),
        api.getSubjects(),
      ]);
      const safeNotes = Array.isArray(notesRes) ? notesRes : [];
      setNotes(safeNotes);
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);

      if (safeNotes.length > 0) {
        // If activeNote is null or not in the filtered list, switch to the first note of this filtered list
        if (!activeNote || !safeNotes.some(n => n.id === activeNote.id)) {
          selectNote(safeNotes[0]);
        }
      } else {
        // No notes in this filter
        setActiveNote(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId, searchQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSubjectId(note.subject_id);
    setSummaryData(null);
    setKeyPointsData(null);
    setQuizData(null);
  };

  const handleCreateNewNote = () => {
    const emptyNote: Note = {
      id: 0,
      user_id: 0,
      title: 'Untitled Study Note',
      content: '',
      subject_id: selectedSubjectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveNote(emptyNote);
    setTitle('Untitled Study Note');
    setContent('');
    setSubjectId(selectedSubjectId);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) return;
    try {
      if (activeNote && activeNote.id > 0) {
        const updated = await api.updateNote(activeNote.id, {
          title,
          content,
          subject_id: subjectId,
        });
        setActiveNote(updated);
      } else {
        const created = await api.createNote({
          title,
          content,
          subject_id: subjectId,
        });
        setActiveNote(created);
      }
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      setActiveNote(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      await api.createSubject({ name: newSubjectName, color: newSubjectColor });
      setNewSubjectName('');
      setShowSubjectModal(false);
      const updatedSubjects = await api.getSubjects();
      setSubjects(Array.isArray(updatedSubjects) ? updatedSubjects : []);
    } catch (err) {
      console.error(err);
    }
  };

  // AI Operations
  const handleAISummarize = async () => {
    const text = content.trim() || activeNote?.content?.trim();
    if (!text) return;
    setAiLoading(true);
    try {
      const fullText = title.trim() ? `${title.trim()}\n\n${text}` : text;
      const res = await api.aiSummarize(
        activeNote && activeNote.id > 0 ? { note_id: activeNote.id, content: fullText } : { content: fullText }
      );
      setSummaryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIKeyPoints = async () => {
    const text = content.trim() || activeNote?.content?.trim();
    if (!text) return;
    setAiLoading(true);
    try {
      const fullText = title.trim() ? `${title.trim()}\n\n${text}` : text;
      const res = await api.aiKeyPoints(
        activeNote && activeNote.id > 0 ? { note_id: activeNote.id, content: fullText } : { content: fullText }
      );
      setKeyPointsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIGenerateQuiz = async () => {
    const text = content.trim() || activeNote?.content?.trim();
    if (!text) return;
    setAiLoading(true);
    try {
      const fullText = title.trim() ? `${title.trim()}\n\n${text}` : text;
      const res = await api.aiGenerateQuiz(
        activeNote && activeNote.id > 0
          ? { note_id: activeNote.id, content: fullText, num_questions: 3 }
          : { content: fullText, num_questions: 3 }
      );
      setQuizData(res);
      setSelectedQuizAnswers({});
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.aiExplain({ topic: explainTopic, context: content.slice(0, 500) });
      setExplainData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const noteContext = content.trim() 
        ? `${title ? title + ': ' : ''}${content.slice(0, 1500)}`
        : undefined;

      const res = await api.aiChat({
        message: msg,
        context: noteContext,
        history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Could not connect to AI service. Please check your backend connection.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AI_TABS = [
    { id: 'summarize', label: 'Summary' },
    { id: 'keypoints', label: 'Bullets' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'explain', label: 'Explain' },
    { id: 'chat', label: 'Chat' },
  ] as const;

  const activeSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name;

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)] gap-4 relative">
        {/* Left Col: Subjects + Notes List */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col sh-card rounded-xl p-3.5 space-y-3 border border-[var(--color-border,#36362F)]">
          {/* Top Actions */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-bold text-[var(--color-text-primary,#FFFBF4)] flex items-center gap-1.5 uppercase tracking-wider font-display">
              <FileText className="w-4 h-4 text-[#8E9B7A]" strokeWidth={1.75} />
              Smart Notes
            </h2>
            <button
              onClick={handleCreateNewNote}
              className="sh-btn-primary px-2.5 py-1 text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              New
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8D8777] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="sh-input pl-8 py-1.5"
            />
          </div>

          {/* Subject Filter Section with Horizontal Scroll */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted,#8D8777)] px-0.5">
              <span className="font-medium">Filter Course</span>
              {selectedSubjectId !== null && (
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="text-[10px] text-[#8E9B7A] hover:underline font-semibold"
                >
                  Clear (All)
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Pills */}
            <div className="sh-filter-scroll">
              <button
                onClick={() => setSelectedSubjectId(null)}
                className={`px-2.5 py-1 rounded-md shrink-0 font-medium text-xs transition-colors ${
                  selectedSubjectId === null
                    ? 'bg-[#FFFBF4] text-[#11120D] font-semibold shadow-sm'
                    : 'bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)]'
                }`}
              >
                All
              </button>
              {subjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(isSelected ? null : sub.id)}
                    className={`px-2.5 py-1 rounded-md shrink-0 font-medium text-xs transition-colors flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#282F24] text-[#8E9B7A] border-[#8E9B7A] font-semibold'
                        : 'bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-secondary,#D8CFBC)] border-[var(--color-border,#36362F)] hover:border-[#565449]'
                    }`}
                    title={isSelected ? 'Click to show all notes' : `Filter by ${sub.name}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                    <span className="whitespace-nowrap">{sub.name}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setShowSubjectModal(true)}
                className="px-2 py-1 rounded-md bg-[var(--color-bg-primary,#11120D)] text-[#8D8777] hover:text-[var(--color-text-primary,#FFFBF4)] border border-[var(--color-border,#36362F)] shrink-0 text-xs flex items-center gap-1"
                title="Add Course Subject"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Notes List Header with Count */}
          <div className="flex items-center justify-between px-0.5 pt-1 text-[11px] text-[var(--color-text-muted,#8D8777)] border-t border-[var(--color-border,#36362F)]">
            <span className="font-medium truncate max-w-[170px]">
              {selectedSubjectId ? `Course: ${activeSubjectName}` : 'All Notes'}
            </span>
            <span className="font-mono text-[10px]">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {notes.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8D8777]">
                {selectedSubjectId ? (
                  <div>
                    <p>No notes in {activeSubjectName}.</p>
                    <button
                      onClick={handleCreateNewNote}
                      className="mt-2 text-[#8E9B7A] underline text-[11px]"
                    >
                      Create one now
                    </button>
                  </div>
                ) : (
                  'No notes found. Create your first note!'
                )}
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[var(--color-bg-elevated,#24241E)] border-[#8E9B7A] text-[var(--color-text-primary,#FFFBF4)]'
                        : 'bg-[var(--color-bg-primary,#11120D)]/50 border-[var(--color-border,#36362F)] text-[var(--color-text-secondary,#D8CFBC)] hover:border-[#565449]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate max-w-[170px]">
                        {note.title}
                      </span>
                      {note.subject && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: note.subject.color }}
                          title={note.subject.name}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-[#8D8777] line-clamp-1 leading-normal">
                      {note.content || 'Empty note...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Canvas: Note Editor */}
        <div className="flex-1 flex flex-col sh-card rounded-xl p-5 border border-[var(--color-border,#36362F)] space-y-3">
          {activeNote ? (
            <>
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border,#36362F)]">
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={subjectId || ''}
                    onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : null)}
                    className="sh-select text-xs py-1"
                  >
                    <option value="">No Course Tag</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAIDrawer(!showAIDrawer)}
                    className="sh-btn-sage px-3 py-1.5 text-xs gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    onClick={handleSaveNote}
                    className="sh-btn-primary px-3 py-1.5 text-xs gap-1.5"
                  >
                    {savedStatus ? <Check className="w-3.5 h-3.5 text-[#11120D]" strokeWidth={2} /> : <Save className="w-3.5 h-3.5" strokeWidth={1.75} />}
                    <span>{savedStatus ? 'Saved' : 'Save'}</span>
                  </button>

                  {activeNote.id > 0 && (
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-1.5 rounded text-[#8D8777] hover:text-[#C76A5E] hover:bg-[#C76A5E]/10 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Body Inputs */}
              <div className="flex-1 flex flex-col space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full bg-transparent text-lg sm:text-xl font-bold text-[var(--color-text-primary,#FFFBF4)] placeholder-[#8D8777] focus:outline-none font-display"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type academic notes, definitions, formulas, or lecture summaries..."
                  className="w-full flex-1 bg-transparent text-xs sm:text-sm text-[var(--color-text-secondary,#D8CFBC)] placeholder-[#8D8777] resize-none focus:outline-none leading-relaxed font-sans"
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No note selected"
              description={selectedSubjectId ? `No notes in course "${activeSubjectName}". Create one to begin.` : "Select a study note from the left sidebar or create a new one to begin editing."}
              action={{
                label: 'Create Note',
                onClick: handleCreateNewNote,
              }}
            />
          )}
        </div>

        {/* Right Drawer: AI Study Studio */}
        {showAIDrawer && (
          <div className="w-full lg:w-96 shrink-0 sh-glass-strong rounded-xl p-5 border border-[#8E9B7A]/40 flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border,#36362F)] mb-4">
              <div className="flex items-center gap-2 text-[#8E9B7A]">
                <BrainCircuit className="w-4 h-4" strokeWidth={1.75} />
                <span className="text-xs font-bold font-display">AI Study Assistant</span>
              </div>
              <button
                onClick={() => setShowAIDrawer(false)}
                className="p-1 rounded text-[#8D8777] hover:text-[var(--color-text-primary,#FFFBF4)]"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* AI Tabs — 5 tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] text-[10px] font-medium mb-4 shrink-0">
              {AI_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAiTab(tab.id);
                    if (tab.id === 'summarize') handleAISummarize();
                    if (tab.id === 'keypoints') handleAIKeyPoints();
                    if (tab.id === 'quiz') handleAIGenerateQuiz();
                  }}
                  className={`py-1.5 rounded capitalize transition-colors ${
                    aiTab === tab.id
                      ? 'bg-[#282F24] text-[#8E9B7A] font-semibold border border-[#8E9B7A]/30'
                      : 'text-[#8D8777] hover:text-[var(--color-text-secondary,#D8CFBC)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Content Area */}
            {aiTab === 'chat' ? (
              /* ── Chat Tab ── */
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                  {chatMessages.length === 0 && (
                    <div className="py-10 text-center space-y-2">
                      <MessageSquare className="w-7 h-7 text-[#565449] mx-auto" strokeWidth={1.5} />
                      <p className="text-xs text-[#8D8777] leading-relaxed">
                        Ask any academic doubt or question.
                      </p>
                      {content && (
                        <p className="text-[11px] text-[#8E9B7A]">
                          ✓ Connected to your current note context.
                        </p>
                      )}
                    </div>
                  )}

                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#282F24] text-[#FFFBF4] border border-[#8E9B7A]/30'
                            : 'bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-secondary,#D8CFBC)] border border-[var(--color-border,#36362F)]'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-xl px-3 py-2 flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
                        <span className="text-[11px] text-[#8D8777]">Gemini is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Clear chat */}
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => setChatMessages([])}
                    className="text-[10px] text-[#8D8777] hover:text-[var(--color-text-primary,#FFFBF4)] mb-2 text-right w-full transition-colors flex items-center justify-end gap-1"
                  >
                    <RotateCcw size={10} />
                    <span>Clear chat</span>
                  </button>
                )}

                {/* Input */}
                <form onSubmit={handleSendChat} className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI study assistant..."
                    disabled={chatLoading}
                    className="sh-input flex-1 text-xs py-2"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="sh-btn-sage p-2 shrink-0 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </form>
              </div>
            ) : (
              /* ── Other tabs (Summarize / Bullets / Quiz / Explain) ── */
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {aiLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
                    <span className="text-xs text-[#8D8777]">Gemini analyzing note concepts...</span>
                  </div>
                ) : (
                  <>
                    {/* Tab 1: Summarize */}
                    {aiTab === 'summarize' && (
                      <div className="space-y-3">
                        {summaryData ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-1.5">
                              <span className="text-[10px] font-bold text-[#8E9B7A] uppercase tracking-wider block font-mono">
                                Key Takeaway
                              </span>
                              <p className="text-xs text-[var(--color-text-primary,#FFFBF4)] font-medium italic leading-relaxed">
                                &ldquo;{summaryData.key_takeaway}&rdquo;
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-1.5">
                              <span className="text-[10px] font-bold text-[#8D8777] uppercase tracking-wider block font-mono">
                                Study Summary
                              </span>
                              <p className="text-xs text-[var(--color-text-secondary,#D8CFBC)] leading-relaxed whitespace-pre-line">
                                {summaryData.summary}
                              </p>
                            </div>

                            <button
                              onClick={() => copyToClipboard(`${summaryData.key_takeaway}\n\n${summaryData.summary}`)}
                              className="w-full sh-btn-secondary py-2 gap-1.5 text-xs"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-[#8E9B7A]" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
                              <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleAISummarize}
                            className="w-full sh-btn-sage py-2 text-xs"
                          >
                            Generate Note Summary
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Key Points */}
                    {aiTab === 'keypoints' && (
                      <div className="space-y-3">
                        {keyPointsData ? (
                          <div className="space-y-2">
                            {keyPointsData.key_points.map((point, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] flex items-start gap-2 text-xs text-[var(--color-text-secondary,#D8CFBC)]"
                              >
                                <span className="w-4 h-4 rounded bg-[#282F24] text-[#8E9B7A] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed">{point}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={handleAIKeyPoints}
                            className="w-full sh-btn-sage py-2 text-xs"
                          >
                            Extract Key Concepts
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Interactive Practice Quiz */}
                    {aiTab === 'quiz' && (
                      <div className="space-y-3">
                        {quizData ? (
                          <div className="space-y-3">
                            {quizData.questions.map((q, qIdx) => {
                              const selectedOption = selectedQuizAnswers[qIdx];
                              const isAnswered = selectedOption !== undefined;

                              return (
                                <div key={qIdx} className="p-3 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-2">
                                  <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)] block">
                                    Q{qIdx + 1}: {q.question}
                                  </span>
                                  <div className="space-y-1.5">
                                    {q.options.map((opt, oIdx) => {
                                      const isSelected = selectedOption === opt;
                                      const isCorrect = opt === q.correct_answer;

                                      let btnStyle = 'bg-[var(--color-bg-surface,#1C1C17)] border-[var(--color-border,#36362F)] text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)]';
                                      if (isAnswered) {
                                        if (isCorrect) btnStyle = 'bg-[#282F24] border-[#8E9B7A] text-[#8E9B7A] font-semibold';
                                        else if (isSelected) btnStyle = 'bg-[#C76A5E]/15 border-[#C76A5E]/40 text-[#C76A5E]';
                                      }

                                      return (
                                        <button
                                          key={oIdx}
                                          disabled={isAnswered}
                                          onClick={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [qIdx]: opt })}
                                          className={`w-full text-left p-2 rounded-lg text-xs border transition-colors ${btnStyle}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {isAnswered && (
                                    <p className="text-[11px] text-[var(--color-text-muted,#8D8777)] pt-1.5 leading-relaxed border-t border-[var(--color-border,#36362F)]">
                                      {q.explanation}
                                    </p>
                                  )}
                                </div>
                              );
                            })}

                            <button
                              onClick={handleAIGenerateQuiz}
                              className="w-full sh-btn-secondary py-2 text-xs"
                            >
                              Regenerate Quiz
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleAIGenerateQuiz}
                            className="w-full sh-btn-sage py-2 text-xs"
                          >
                            Generate Practice Quiz
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Topic Explainer */}
                    {aiTab === 'explain' && (
                      <div className="space-y-3">
                        <form onSubmit={handleAIExplain} className="space-y-2">
                          <input
                            type="text"
                            value={explainTopic}
                            onChange={(e) => setExplainTopic(e.target.value)}
                            placeholder="e.g. Dynamic Programming, Dijkstra, Fourier..."
                            className="sh-input text-xs"
                          />
                          <button
                            type="submit"
                            className="w-full sh-btn-sage py-2 text-xs"
                          >
                            Explain Concept
                          </button>
                        </form>

                        {explainData && (
                          <div className="p-3 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-1.5">
                            <span className="text-xs font-bold text-[#8E9B7A]">{explainData.topic}</span>
                            <p className="text-xs text-[var(--color-text-secondary,#D8CFBC)] leading-relaxed whitespace-pre-line">
                              {explainData.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full sh-glass-strong rounded-2xl p-6 border border-[var(--color-border,#36362F)] space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--color-text-primary,#FFFBF4)] font-display">Add Course Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-secondary,#D8CFBC)] block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="sh-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary,#D8CFBC)] block mb-1.5">Color Tag</label>
                <div className="flex items-center gap-2">
                  {['#8E9B7A', '#C4975A', '#C76A5E', '#565449', '#8D8777', '#36362F'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewSubjectColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newSubjectColor === col ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="sh-btn-secondary px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn-primary px-3 py-1.5 text-xs"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
