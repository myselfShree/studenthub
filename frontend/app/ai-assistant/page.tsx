'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Check, 
  Copy, 
  RotateCcw,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AIQuizResponse, AISummaryResponse, AIExplainResponse } from '@/types';
import AuthPromptModal from '@/components/AuthPromptModal';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'explain' | 'quiz' | 'summarize'>('chat');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Concept Explainer state
  const [explainTopic, setExplainTopic] = useState('');
  const [explainContext, setExplainContext] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<AIExplainResponse | null>(null);

  // Quiz Generator state
  const [quizTopic, setQuizTopic] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<AIQuizResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Summarizer state
  const [summarizeContent, setSummarizeContent] = useState('');
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<AISummaryResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // AI History state
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getAIHistory();
      if (Array.isArray(res)) setHistory(res.slice(0, 8));
    } catch (_) {
      // Non-blocking
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: msg }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.aiChat({
        message: msg,
        history: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
      loadHistory();
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Unable to reach the AI assistant. Please ensure your backend is running.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!explainTopic.trim() || explainLoading) return;
    setExplainLoading(true);
    try {
      const res = await api.aiExplain({ topic: explainTopic.trim(), context: explainContext.trim() || undefined });
      setExplainResult(res);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to explain topic.');
    } finally {
      setExplainLoading(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!quizTopic.trim() || quizLoading) return;
    setQuizLoading(true);
    setSelectedAnswers({});
    try {
      const res = await api.aiGenerateQuiz({ content: quizTopic.trim(), num_questions: 3 });
      setQuizResult(res);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!summarizeContent.trim() || summarizeLoading) return;
    setSummarizeLoading(true);
    try {
      const res = await api.aiSummarize({ content: summarizeContent.trim() });
      setSummaryResult(res);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to summarize notes.');
    } finally {
      setSummarizeLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto py-2">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border,#36362F)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/40 flex items-center justify-center text-[#8E9B7A]">
              <BrainCircuit size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary,#FFFBF4)] font-display">
                AI Study Assistant
              </h1>
              <p className="text-xs text-[var(--color-text-muted,#8D8777)]">
                Autonomous academic tutor, concept breakdown, quiz revision & notes synthesizer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)] text-[11px] text-[#8E9B7A]">
            <Sparkles size={12} />
            <span>Gemini AI Connected</span>
          </div>
        </div>

        {/* Feature Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'chat', label: 'Study Chat', icon: BrainCircuit, desc: 'Ask any doubt' },
            { id: 'explain', label: 'Concept Explainer', icon: HelpCircle, desc: 'Intuitive analogies' },
            { id: 'quiz', label: 'Quiz Generator', icon: BookOpen, desc: 'Exam practice MCQs' },
            { id: 'summarize', label: 'Note Synthesizer', icon: FileText, desc: 'Key takeaways' },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#282F24] border-[#8E9B7A] text-[var(--color-text-primary,#FFFBF4)] shadow-sm'
                    : 'bg-[var(--color-bg-surface,#1C1C17)] border-[var(--color-border,#36362F)] text-[var(--color-text-secondary,#D8CFBC)] hover:border-[#565449]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={15} className={isSelected ? 'text-[#8E9B7A]' : 'text-[var(--color-text-muted,#8D8777)]'} />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted,#8D8777)]">{tab.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interactive Panel (2 cols) */}
          <div className="lg:col-span-2 sh-card rounded-xl p-5 border border-[var(--color-border,#36362F)] min-h-[520px] flex flex-col">
            
            {/* 1. STUDY CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col flex-1 h-full">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border,#36362F)] mb-3">
                  <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)]">Conversational Study Partner</span>
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => setChatMessages([])}
                      className="text-[11px] text-[var(--color-text-muted,#8D8777)] hover:text-[#C76A5E] flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw size={11} />
                      <span>Clear conversation</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 max-h-[420px]">
                  {chatMessages.length === 0 ? (
                    <div className="py-20 text-center space-y-2.5">
                      <BrainCircuit size={32} className="mx-auto text-[var(--color-text-muted,#565449)]" />
                      <p className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)]">
                        What concept or topic are you studying today?
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted,#8D8777)] max-w-sm mx-auto">
                        Ask for code walkthroughs, math derivations, theoretical proofs, or study routines.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-[#282F24] text-[#FFFBF4] border border-[#8E9B7A]/30'
                              : 'bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-secondary,#D8CFBC)] border border-[var(--color-border,#36362F)]'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-[var(--color-text-muted,#8D8777)]">
                        <Loader2 size={13} className="animate-spin text-[#8E9B7A]" />
                        <span>Generating answer…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-[var(--color-border,#36362F)]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask any question, definition, or academic problem..."
                    disabled={chatLoading}
                    className="sh-input flex-1 text-xs py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="sh-btn-sage px-4 py-2.5 text-xs shrink-0 disabled:opacity-40"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* 2. CONCEPT EXPLAINER TAB */}
            {activeTab === 'explain' && (
              <div className="space-y-4 flex-1">
                <form onSubmit={handleExplain} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider block mb-1">
                      Academic Topic or Concept
                    </label>
                    <input
                      type="text"
                      required
                      value={explainTopic}
                      onChange={(e) => setExplainTopic(e.target.value)}
                      placeholder="e.g. Dynamic Programming, Dijkstra's Algorithm, Convolutional Neural Networks..."
                      className="sh-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider block mb-1">
                      Additional Context (Optional)
                    </label>
                    <textarea
                      value={explainContext}
                      onChange={(e) => setExplainContext(e.target.value)}
                      placeholder="Paste textbook excerpt or notes if you want the explanation grounded in your syllabus..."
                      className="sh-input text-xs h-20 resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={explainLoading}
                    className="sh-btn-sage py-2.5 px-4 text-xs w-full disabled:opacity-50"
                  >
                    {explainLoading ? 'Generating Explanation…' : 'Explain Concept with Analogies'}
                  </button>
                </form>

                {explainResult && (
                  <div className="p-4 rounded-xl bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-2 mt-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8E9B7A]">{explainResult.topic}</span>
                      <button
                        onClick={() => copyText(explainResult.explanation)}
                        className="text-[11px] text-[var(--color-text-muted,#8D8777)] hover:text-[#FFFBF4]"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary,#D8CFBC)] leading-relaxed whitespace-pre-line">
                      {explainResult.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. PRACTICE QUIZ TAB */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 flex-1">
                <form onSubmit={handleGenerateQuiz} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider block mb-1">
                      Topic or Study Material to Quiz On
                    </label>
                    <textarea
                      required
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="Paste notes, lecture bullets, or a topic name (e.g. Operating System Deadlocks)..."
                      className="sh-input text-xs h-24 resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={quizLoading}
                    className="sh-btn-sage py-2.5 px-4 text-xs w-full disabled:opacity-50"
                  >
                    {quizLoading ? 'Generating Questions…' : 'Generate 3 Exam Practice MCQs'}
                  </button>
                </form>

                {quizResult && (
                  <div className="space-y-3 mt-4">
                    {quizResult.questions.map((q, qIdx) => {
                      const selectedOpt = selectedAnswers[qIdx];
                      const isAnswered = selectedOpt !== undefined;

                      return (
                        <div key={qIdx} className="p-3.5 rounded-xl bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-2">
                          <p className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)]">
                            Q{qIdx + 1}: {q.question}
                          </p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedOpt === opt;
                              const isCorrect = opt === q.correct_answer;
                              let btnClass = 'bg-[var(--color-bg-surface,#1C1C17)] border-[var(--color-border,#36362F)] text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)]';
                              if (isAnswered) {
                                if (isCorrect) btnClass = 'bg-[#282F24] border-[#8E9B7A] text-[#8E9B7A] font-semibold';
                                else if (isSelected) btnClass = 'bg-[#C76A5E]/15 border-[#C76A5E]/40 text-[#C76A5E]';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  disabled={isAnswered}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: opt })}
                                  className={`w-full text-left p-2 rounded-lg text-xs border transition-colors ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isAnswered && (
                            <p className="text-[11px] text-[var(--color-text-muted,#8D8777)] pt-1.5 border-t border-[var(--color-border,#36362F)] leading-relaxed">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. NOTE SYNTHESIZER TAB */}
            {activeTab === 'summarize' && (
              <div className="space-y-4 flex-1">
                <form onSubmit={handleSummarize} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider block mb-1">
                      Paste Raw Notes / Lecture Text
                    </label>
                    <textarea
                      required
                      value={summarizeContent}
                      onChange={(e) => setSummarizeContent(e.target.value)}
                      placeholder="Paste study material or textbook content to extract study summaries and memorable takeaways..."
                      className="sh-input text-xs h-32 resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={summarizeLoading}
                    className="sh-btn-sage py-2.5 px-4 text-xs w-full disabled:opacity-50"
                  >
                    {summarizeLoading ? 'Synthesizing Notes…' : 'Synthesize Key Takeaway & Summary'}
                  </button>
                </form>

                {summaryResult && (
                  <div className="space-y-3 mt-4 animate-fade-in">
                    <div className="p-3.5 rounded-xl bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#8E9B7A] uppercase tracking-wider block font-mono">
                        Key Takeaway
                      </span>
                      <p className="text-xs text-[var(--color-text-primary,#FFFBF4)] font-medium italic leading-relaxed">
                        &ldquo;{summaryResult.key_takeaway}&rdquo;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted,#8D8777)] uppercase tracking-wider block font-mono">
                        Summary
                      </span>
                      <p className="text-xs text-[var(--color-text-secondary,#D8CFBC)] leading-relaxed whitespace-pre-line">
                        {summaryResult.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => copyText(`${summaryResult.key_takeaway}\n\n${summaryResult.summary}`)}
                      className="sh-btn-secondary w-full py-2 text-xs gap-1.5"
                    >
                      {copied ? <Check size={13} className="text-[#8E9B7A]" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy Summary'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Study Starters & History */}
          <div className="space-y-5">
            {/* Quick Starters */}
            <div className="sh-card rounded-xl p-4 border border-[var(--color-border,#36362F)] space-y-3">
              <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)] block">
                Quick Starters
              </span>
              <div className="space-y-2">
                {[
                  'Explain Big O Notation with simple analogies',
                  'Summarize differences between TCP and UDP',
                  'Generate 3 practice MCQs on Database Normalization',
                  'Break down Bayes Theorem step by step',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab('chat');
                      setChatInput(prompt);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] text-[11px] text-[var(--color-text-secondary,#D8CFBC)] hover:border-[#8E9B7A] transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{prompt}</span>
                    <ArrowRight size={12} className="text-[var(--color-text-muted,#8D8777)] group-hover:text-[#8E9B7A] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Interaction Log */}
            <div className="sh-card rounded-xl p-4 border border-[var(--color-border,#36362F)] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)]">
                <Clock size={13} className="text-[#8E9B7A]" />
                <span>Recent AI Interactions</span>
              </div>
              {history.length === 0 ? (
                <p className="text-[11px] text-[var(--color-text-muted,#8D8777)]">No interactions yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] text-[11px]"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted,#8D8777)] mb-0.5">
                        <span className="uppercase font-mono text-[#8E9B7A]">{item.operation}</span>
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[var(--color-text-secondary,#D8CFBC)] truncate">{item.prompt_input}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthPromptModal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in to use the AI Study Assistant"
        description="Sign up for free to ask study questions, explain academic topics, generate practice quizzes, and synthesize lecture notes."
      />
    </AppLayout>
  );
}
