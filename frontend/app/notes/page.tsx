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
  Check, 
  Copy, 
  X, 
  FileText,
  Loader2,
  Save,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { SkeletonTextBlock } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

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
  const [aiTab, setAiTab] = useState<'summarize' | 'keypoints' | 'quiz' | 'explain'>('summarize');
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [keyPointsData, setKeyPointsData] = useState<AIKeyPointsResponse | null>(null);
  const [quizData, setQuizData] = useState<AIQuizResponse | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [explainTopic, setExplainTopic] = useState('');
  const [explainData, setExplainData] = useState<AIExplainResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

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

      if (safeNotes.length > 0 && !activeNote) {
        selectNote(safeNotes[0]);
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
      <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)] gap-4 relative">
        {/* Left Col: Subjects + Notes List */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col sh-card rounded-xl p-3.5 space-y-3 border border-[#36362F]">
          {/* Top Actions */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-bold text-[#FFFBF4] flex items-center gap-1.5 uppercase tracking-wider font-display">
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

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className={`px-2 py-1 rounded-md shrink-0 font-medium transition-colors ${
                selectedSubjectId === null
                  ? 'bg-[#FFFBF4] text-[#11120D] font-semibold'
                  : 'bg-[#11120D] text-[#D8CFBC] hover:bg-[#24241E] border border-[#36362F]'
              }`}
            >
              All
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-2 py-1 rounded-md shrink-0 font-medium transition-colors flex items-center gap-1.5 border ${
                  selectedSubjectId === sub.id
                    ? 'bg-[#282F24] text-[#8E9B7A] border-[#8E9B7A]'
                    : 'bg-[#11120D] text-[#D8CFBC] border-[#36362F] hover:border-[#565449]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                <span>{sub.name}</span>
              </button>
            ))}
            <button
              onClick={() => setShowSubjectModal(true)}
              className="p-1 rounded bg-[#11120D] text-[#8D8777] hover:text-[#FFFBF4] border border-[#36362F] shrink-0"
              title="Add Course Subject"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {notes.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8D8777]">
                No notes found. Create your first note!
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
                        ? 'bg-[#24241E] border-[#8E9B7A] text-[#FFFBF4]'
                        : 'bg-[#11120D]/50 border-[#36362F] text-[#D8CFBC] hover:border-[#565449]'
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

        {/* Center Canvas: Note Editor (Flat high-contrast area for writing) */}
        <div className="flex-1 flex flex-col sh-card rounded-xl p-5 border border-[#36362F] space-y-3">
          {activeNote ? (
            <>
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#36362F]">
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
                  className="w-full bg-transparent text-lg sm:text-xl font-bold text-[#FFFBF4] placeholder-[#8D8777] focus:outline-none font-display"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type academic notes, definitions, formulas, or lecture summaries..."
                  className="w-full flex-1 bg-transparent text-xs sm:text-sm text-[#D8CFBC] placeholder-[#8D8777] resize-none focus:outline-none leading-relaxed font-sans"
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No note selected"
              description="Select a study note from the left sidebar or create a new one to begin editing."
              action={{
                label: 'Create Note',
                onClick: handleCreateNewNote,
              }}
            />
          )}
        </div>

        {/* Right Drawer: AI Study Studio (.sh-glass-strong elevated panel) */}
        {showAIDrawer && (
          <div className="w-full lg:w-96 shrink-0 sh-glass-strong rounded-xl p-5 border border-[#8E9B7A]/40 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#36362F]">
                <div className="flex items-center gap-2 text-[#8E9B7A]">
                  <BrainCircuit className="w-4 h-4" strokeWidth={1.75} />
                  <span className="text-xs font-bold font-display">Gemini AI Study Assistant</span>
                </div>
                <button
                  onClick={() => setShowAIDrawer(false)}
                  className="p-1 rounded text-[#8D8777] hover:text-[#FFFBF4]"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>

              {/* AI Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#11120D] border border-[#36362F] text-[11px] font-medium">
                {(['summarize', 'keypoints', 'quiz', 'explain'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { 
                      setAiTab(tab); 
                      if (tab === 'summarize') handleAISummarize();
                      if (tab === 'keypoints') handleAIKeyPoints();
                      if (tab === 'quiz') handleAIGenerateQuiz();
                    }}
                    className={`py-1 rounded capitalize transition-colors ${
                      aiTab === tab ? 'bg-[#282F24] text-[#8E9B7A] font-semibold border border-[#8E9B7A]/30' : 'text-[#8D8777] hover:text-[#D8CFBC]'
                    }`}
                  >
                    {tab === 'keypoints' ? 'Bullets' : tab}
                  </button>
                ))}
              </div>

              {/* AI Content Area */}
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
                          <div className="p-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-1.5">
                            <span className="text-[10px] font-bold text-[#8E9B7A] uppercase tracking-wider block font-mono">
                              Key Takeaway
                            </span>
                            <p className="text-xs text-[#FFFBF4] font-medium italic leading-relaxed">
                              "{summaryData.key_takeaway}"
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-1.5">
                            <span className="text-[10px] font-bold text-[#8D8777] uppercase tracking-wider block font-mono">
                              Study Summary
                            </span>
                            <p className="text-xs text-[#D8CFBC] leading-relaxed whitespace-pre-line">
                              {summaryData.summary}
                            </p>
                          </div>

                          <button
                            onClick={() => copyToClipboard(`${summaryData.key_takeaway}\n\n${summaryData.summary}`)}
                            className="w-full sh-btn-secondary py-2 gap-1.5"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-[#8E9B7A]" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
                            <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAISummarize}
                          className="w-full sh-btn-sage py-2"
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
                              className="p-2.5 rounded-lg bg-[#11120D] border border-[#36362F] flex items-start gap-2 text-xs text-[#D8CFBC]"
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
                          className="w-full sh-btn-sage py-2"
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
                              <div key={qIdx} className="p-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-2">
                                <span className="text-xs font-semibold text-[#FFFBF4] block">
                                  Q{qIdx + 1}: {q.question}
                                </span>
                                <div className="space-y-1.5">
                                  {q.options.map((opt, oIdx) => {
                                    const isSelected = selectedOption === opt;
                                    const isCorrect = opt === q.correct_answer;

                                    let btnStyle = 'bg-[#1C1C17] border-[#36362F] text-[#D8CFBC] hover:bg-[#24241E]';
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
                                  <p className="text-[11px] text-[#8D8777] pt-1.5 leading-relaxed border-t border-[#36362F]">
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
                          className="w-full sh-btn-sage py-2"
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
                          className="sh-input"
                        />
                        <button
                          type="submit"
                          className="w-full sh-btn-sage py-2"
                        >
                          Explain Concept
                        </button>
                      </form>

                      {explainData && (
                        <div className="p-3 rounded-lg bg-[#11120D] border border-[#36362F] space-y-1.5">
                          <span className="text-xs font-bold text-[#8E9B7A]">{explainData.topic}</span>
                          <p className="text-xs text-[#D8CFBC] leading-relaxed whitespace-pre-line">
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full sh-glass-strong rounded-2xl p-6 border border-[#36362F] space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#FFFBF4] font-display">Add Course Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs text-[#D8CFBC] block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="sh-input"
                />
              </div>

              <div>
                <label className="text-xs text-[#D8CFBC] block mb-1.5">Color Tag</label>
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
                  className="sh-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn-primary"
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
