'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { Note, Subject, AISummaryResponse, AIKeyPointsResponse, AIQuizResponse, AIExplainResponse } from '@/types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Tag, 
  Check, 
  Copy, 
  X, 
  HelpCircle, 
  Lightbulb, 
  FileText,
  Loader2,
  Save,
  BrainCircuit
} from 'lucide-react';

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
  const [newSubjectColor, setNewSubjectColor] = useState('#6366F1');

  // AI Drawer State
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [aiTab, setAiTab] = useState<'summarize' | 'keypoints' | 'quiz' | 'explain'>('summarize');
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [keyPointsData, setKeyPointsData] = useState<AIKeyPointsResponse | null>(null);
  const [quizData, setQuizData] = useState<AIQuizResponse | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [explainTopic, setExplainTopic] = useState('');
  const [explainData, setExplainData] = useState<AIExplainResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
      setNotes(notesRes);
      setSubjects(subjectsRes);

      if (notesRes.length > 0 && !activeNote) {
        selectNote(notesRes[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId, searchQuery]);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSubjectId(note.subject_id);
    // Reset AI state when switching note
    setSummaryData(null);
    setKeyPointsData(null);
    setQuizData(null);
  };

  const handleCreateNewNote = () => {
    const emptyNote: Note = {
      id: 0,
      user_id: 0,
      title: 'Untitled Note',
      content: '',
      subject_id: selectedSubjectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveNote(emptyNote);
    setTitle('Untitled Note');
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
      setSubjects(updatedSubjects);
    } catch (err) {
      console.error(err);
    }
  };

  // AI Operations
  const handleAISummarize = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.aiSummarize(
        activeNote && activeNote.id > 0 ? { note_id: activeNote.id } : { content }
      );
      setSummaryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIKeyPoints = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.aiKeyPoints(
        activeNote && activeNote.id > 0 ? { note_id: activeNote.id } : { content }
      );
      setKeyPointsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIGenerateQuiz = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.aiGenerateQuiz(
        activeNote && activeNote.id > 0 ? { note_id: activeNote.id, num_questions: 3 } : { content, num_questions: 3 }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-6 relative">
        {/* Left Col: Subjects + Notes List */}
        <div className="w-80 shrink-0 flex flex-col glass-panel rounded-3xl p-4 space-y-4 border border-slate-800/80">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Smart Notes
            </h2>
            <button
              onClick={handleCreateNewNote}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in notes..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                selectedSubjectId === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all flex items-center gap-1.5 ${
                  selectedSubjectId === sub.id
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                {sub.name}
              </button>
            ))}
            <button
              onClick={() => setShowSubjectModal(true)}
              className="p-1 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white shrink-0"
              title="Add Subject"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No notes found. Write one!
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate max-w-[180px]">
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
                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                      {note.content || 'No content yet...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Canvas: Note Editor */}
        <div className="flex-1 flex flex-col glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
          {activeNote ? (
            <>
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3 flex-1">
                  {/* Subject Dropdown */}
                  <select
                    value={subjectId || ''}
                    onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : null)}
                    className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No Subject</option>
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
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assistant
                  </button>

                  <button
                    onClick={handleSaveNote}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>

                  {activeNote.id > 0 && (
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div className="flex-1 flex flex-col space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-slate-400 focus:outline-none"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing your academic notes, code snippets, or definitions here..."
                  className="w-full flex-1 bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-400 resize-none focus:outline-none leading-relaxed font-sans"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-10 h-10 text-slate-600 mb-2" />
              Select a note or create a new one to begin editing.
            </div>
          )}
        </div>

        {/* Right Drawer: AI Study Studio */}
        {showAIDrawer && (
          <div className="w-96 shrink-0 glass-panel rounded-3xl p-5 border border-purple-500/30 flex flex-col justify-between shadow-2xl bg-[#0e1322]">
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-xs font-bold">Gemini AI Study Assistant</span>
                </div>
                <button
                  onClick={() => setShowAIDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AI Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => { setAiTab('summarize'); handleAISummarize(); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    aiTab === 'summarize' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => { setAiTab('keypoints'); handleAIKeyPoints(); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    aiTab === 'keypoints' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bullets
                </button>
                <button
                  onClick={() => { setAiTab('quiz'); handleAIGenerateQuiz(); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    aiTab === 'quiz' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Quiz
                </button>
                <button
                  onClick={() => setAiTab('explain')}
                  className={`py-1.5 rounded-lg transition-all ${
                    aiTab === 'explain' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Explain
                </button>
              </div>

              {/* AI Content Area */}
              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-400">Gemini analyzing note content...</span>
                </div>
              ) : (
                <>
                  {/* Tab 1: Summarize */}
                  {aiTab === 'summarize' && (
                    <div className="space-y-4">
                      {summaryData ? (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                              Key Takeaway
                            </span>
                            <p className="text-xs text-slate-200 font-medium italic">
                              "{summaryData.key_takeaway}"
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Study Summary
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {summaryData.summary}
                            </p>
                          </div>

                          <button
                            onClick={() => copyToClipboard(`${summaryData.key_takeaway}\n\n${summaryData.summary}`)}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied to Clipboard' : 'Copy Summary'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAISummarize}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Generate Note Summary
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Key Points */}
                  {aiTab === 'keypoints' && (
                    <div className="space-y-4">
                      {keyPointsData ? (
                        <div className="space-y-2.5">
                          {keyPointsData.key_points.map((point, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300"
                            >
                              <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{point}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={handleAIKeyPoints}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Extract Key Concepts
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Interactive Practice Quiz */}
                  {aiTab === 'quiz' && (
                    <div className="space-y-4">
                      {quizData ? (
                        <div className="space-y-4">
                          {quizData.questions.map((q, qIdx) => {
                            const selectedOption = selectedQuizAnswers[qIdx];
                            const isAnswered = selectedOption !== undefined;

                            return (
                              <div key={qIdx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                                <span className="text-xs font-bold text-white block">
                                  Q{qIdx + 1}: {q.question}
                                </span>
                                <div className="space-y-1.5">
                                  {q.options.map((opt, oIdx) => {
                                    const isSelected = selectedOption === opt;
                                    const isCorrect = opt === q.correct_answer;

                                    let btnStyle = 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800';
                                    if (isAnswered) {
                                      if (isCorrect) btnStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold';
                                      else if (isSelected) btnStyle = 'bg-red-500/15 border-red-500/40 text-red-400';
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        disabled={isAnswered}
                                        onClick={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [qIdx]: opt })}
                                        className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all ${btnStyle}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-slate-800">
                                    💡 {q.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          onClick={handleAIGenerateQuiz}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Generate Practice Quiz
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Topic Explainer */}
                  {aiTab === 'explain' && (
                    <div className="space-y-4">
                      <form onSubmit={handleAIExplain} className="space-y-2">
                        <input
                          type="text"
                          value={explainTopic}
                          onChange={(e) => setExplainTopic(e.target.value)}
                          placeholder="e.g. Dynamic Programming, Dijkstra..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                        >
                          Explain Concept
                        </button>
                      </form>

                      {explainData && (
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-purple-400">{explainData.topic}</span>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {explainData.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Academic Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Color Tag</label>
                <div className="flex items-center gap-2">
                  {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map((col) => (
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
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
