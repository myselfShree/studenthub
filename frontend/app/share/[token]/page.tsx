'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, ShieldCheck, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface ShareInfo {
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  is_active: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(str: string) {
  return new Date(str).toLocaleString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [gone, setGone] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(BASE + '/files/shared/' + token);
        if (res.status === 404 || res.status === 410) { setGone(true); return; }
        if (!res.ok) { setGone(true); return; }
        const data = await res.json();
        setInfo(data);
      } catch { setGone(true); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [token, BASE]);

  const handleDownload = () => {
    setDownloading(true);
    window.location.href = BASE + '/files/shared/' + token + '/download';
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-300 tracking-wide">StudentHub</span>
          </div>
          <p className="text-xs text-slate-600">Secure File Sharing</p>
        </div>
        {loading ? (
          <div className="rounded-2xl p-10 border border-slate-700/30 text-center" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(24px)' }}>
            <Loader2 className="animate-spin text-indigo-400 mx-auto mb-3" size={28} />
            <p className="text-slate-400 text-sm">Loading file info...</p>
          </div>
        ) : gone || !info || !info.is_active ? (
          <div className="rounded-2xl p-8 border border-red-500/20 text-center" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(24px)' }}>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 inline-block mb-4">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Link Expired</h2>
            <p className="text-slate-400 text-sm">This share link is no longer available. It may have expired or reached its download limit.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-700/30 overflow-hidden" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(24px)' }}>
            <div className="px-6 pt-6 pb-5 border-b border-slate-700/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                  <FileText size={22} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-white leading-snug break-words">{info.filename}</h1>
                  <p className="text-xs text-slate-500 mt-1">{formatBytes(info.file_size)}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              {info.expires_at && (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 flex-shrink-0"><Clock size={12} className="text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Expires</p>
                    <p className="text-xs text-slate-300">{formatDate(info.expires_at)}</p>
                  </div>
                </div>
              )}
              {info.max_downloads != null && (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 flex-shrink-0"><Download size={12} className="text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Downloads</p>
                    <p className="text-xs text-slate-300">{info.download_count} of {info.max_downloads} used</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleDownload} disabled={downloading} className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloading ? 'Starting download...' : 'Download Study File'}
              </button>
              <p className="text-center text-xs text-slate-600 mt-3">Shared securely via StudentHub</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
