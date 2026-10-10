'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Send, BrainCircuit, Sparkles } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function GlobalChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    const userMsg: ChatMsg = { role: 'user', content: msg };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput('');
    setLoading(true);
    try {
      const res = await api.aiChat({
        message: msg,
        history: msgs.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMsgs([...next, { role: 'assistant', content: res.reply }]);
    } catch {
      setMsgs([
        ...next,
        { role: 'assistant', content: 'Could not connect to AI assistant. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ width: '50px', height: '50px' }}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#282F24] border border-[#8E9B7A]/50 text-[#8E9B7A] shadow-2xl flex items-center justify-center hover:bg-[#323929] hover:border-[#8E9B7A] transition-all hover:scale-105"
          title="AI Study Assistant"
          aria-label="Open AI Study Assistant"
        >
          <BrainCircuit size={22} strokeWidth={1.75} />
        </button>
      )}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-[var(--color-border,#36362F)] bg-[var(--color-bg-surface,#1C1C17)] shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          style={{ height: '480px' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border,#36362F)] bg-[var(--color-bg-primary,#11120D)] shrink-0">
            <div className="flex items-center gap-2 text-[#8E9B7A]">
              <BrainCircuit size={16} strokeWidth={1.75} />
              <span className="text-xs font-bold text-[var(--color-text-primary,#FFFBF4)]">AI Study Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {msgs.length > 0 && (
                <button
                  onClick={() => setMsgs([])}
                  className="px-2 py-1 text-[10px] text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] transition-colors"
                aria-label="Close chat"
              >
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {msgs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-4">
                <BrainCircuit size={28} strokeWidth={1.5} className="text-[#8E9B7A]" />
                <p className="text-xs text-[var(--color-text-muted,#8D8777)] leading-relaxed">
                  Ask me anything — academic concepts, formulas, definitions, or study strategies.
                </p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#282F24] text-[#FFFBF4] border border-[#8E9B7A]/30'
                      : 'bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-primary,#D8CFBC)] border border-[var(--color-border,#36362F)]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
                  <span className="text-[11px] text-[var(--color-text-muted,#8D8777)]">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={send}
            className="flex items-center gap-2 p-3 border-t border-[var(--color-border,#36362F)] bg-[var(--color-bg-surface,#1C1C17)] shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={loading}
              className="sh-input flex-1 text-xs py-2"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="sh-btn-sage p-2 shrink-0 disabled:opacity-40"
              aria-label="Send prompt"
            >
              <Send size={14} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
