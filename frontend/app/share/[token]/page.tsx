'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import StudentHubLogo from '@/components/StudentHubLogo';

interface ShareInfo {
  filename: string;
  file_size: number;
  mime_type: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  is_active: boolean;
  download_url?: string;
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
    <div className="min-h-screen bg-[#11120D] text-[#FFFBF4] flex items-center justify-center p-6 relative overflow-hidden selection:bg-[#565449] selection:text-[#FFFBF4]">
      {/* Background Subtle Warm Radial Glow */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(86,84,73,0.15) 0%, rgba(17,18,13,0.8) 70%, #11120D 100%)',
        }}
      />

      <div className="relative w-full max-w-sm z-10 space-y-4">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center">
            <StudentHubLogo size={36} textSize="text-sm font-semibold" />
          </div>
          <p className="text-xs text-[#8D8777]">Secure Academic File Access</p>
        </div>

        {loading ? (
          <div className="sh-glass-strong rounded-2xl p-10 border border-[#36362F] text-center shadow-2xl space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin mx-auto" />
            <p className="text-[#8D8777] text-xs font-medium">Resolving secure study file...</p>
          </div>
        ) : gone || !info || !info.is_active ? (
          <div className="sh-glass-strong rounded-2xl p-8 border border-[#C76A5E]/30 text-center shadow-2xl space-y-3">
            <div className="p-3.5 rounded-xl bg-[#C76A5E]/10 border border-[#C76A5E]/20 inline-block text-[#C76A5E]">
              <AlertTriangle size={24} strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-bold text-[#FFFBF4] font-display">Link Expired or Inactive</h2>
            <p className="text-xs text-[#8D8777] leading-relaxed">This share link is no longer available. It may have expired or reached its maximum download limit.</p>
          </div>
        ) : (
          <div className="sh-glass-strong rounded-2xl border border-[#36362F] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#36362F]">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-[#24241E] border border-[#36362F] text-[#8E9B7A] flex-shrink-0">
                  <FileText size={22} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-[#FFFBF4] leading-snug break-words font-display">{info.filename}</h1>
                  <p className="text-xs text-[#8D8777] mt-0.5 font-mono">{formatBytes(info.file_size)}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {info.expires_at && (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11120D] text-[#8D8777] border border-[#36362F] flex-shrink-0">
                    <Clock size={12} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8D8777] uppercase tracking-wider font-mono">Expires</p>
                    <p className="text-xs text-[#D8CFBC]">{formatDate(info.expires_at)}</p>
                  </div>
                </div>
              )}

              {info.max_downloads != null && (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11120D] text-[#8D8777] border border-[#36362F] flex-shrink-0">
                    <Download size={12} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8D8777] uppercase tracking-wider font-mono">Downloads</p>
                    <p className="text-xs text-[#D8CFBC]">{info.download_count} of {info.max_downloads} used</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 pt-0 space-y-3">
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                className="w-full sh-btn-primary py-3 gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#11120D]" />
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} strokeWidth={2} />
                    <span>Download Study File</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-[#8D8777]">Shared securely via Student Hub</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
