'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Upload, FileText, Share2, Download, Trash2, X, Copy,
  Check, QrCode, Link2, Loader2, FolderOpen, Eye,
} from 'lucide-react';

interface FileItem {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  shares: ShareItem[];
}

interface ShareItem {
  id: number;
  share_token: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  is_active: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [shareModal, setShareModal] = useState<{ file: FileItem; token?: string } | null>(null);
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareForm, setShareForm] = useState({ expires_hours: '24', max_downloads: '' });
  const [sharingFile, setSharingFile] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try { const data = await api.get('/files'); setFiles(data); }
    catch { setError('Failed to load files'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload('/files/upload', formData);
      fetchFiles();
    } catch { setError('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleShare = async () => {
    if (!shareModal) return;
    setSharingFile(true);
    try {
      const payload: Record<string, unknown> = {};
      if (shareForm.expires_hours) payload.expires_hours = parseInt(shareForm.expires_hours);
      if (shareForm.max_downloads) payload.max_downloads = parseInt(shareForm.max_downloads);
      const data = await api.post(`/files/${shareModal.file.id}/share`, payload);
      setShareModal({ ...shareModal, token: data.share_token });
      fetchFiles();
    } catch { setError('Share failed'); }
    finally { setSharingFile(false); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/files/${id}`); fetchFiles(); }
    catch { setError('Delete failed'); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = (token: string) => `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/share/${token}`;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  return (
    <AppLayout>
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">File Sharing</h1>
            <p className="text-slate-400 text-sm mt-0.5">Upload and share files via secure QR codes</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mb-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 flex flex-col items-center justify-center gap-3 ${
            dragOver ? 'border-indigo-500/70 bg-indigo-500/10' : 'border-slate-700/50 hover:border-slate-600/70 bg-slate-900/30'
          }`}
        >
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-indigo-400" size={32} />
              <p className="text-slate-300 text-sm font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <Upload size={24} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-slate-200 text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-slate-500 text-xs mt-1">Any file type supported</p>
              </div>
            </>
          )}
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Files List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/40 mb-4"><FolderOpen size={32} className="text-slate-500" /></div>
            <p className="text-slate-300 font-medium">No files uploaded yet</p>
            <p className="text-slate-500 text-sm mt-1">Upload a file to get a shareable QR code</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/30">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-700/40 bg-slate-900/50">
              {['File','Size','Uploaded','Shares','Actions'].map((h,i) => (
                <p key={i} className={`text-xs font-medium text-slate-500 ${i===0?'col-span-4':i===1?'col-span-2':i===2?'col-span-2':i===3?'col-span-2':'col-span-2'}`}>{h}</p>
              ))}
            </div>
            {files.map(file => (
              <div key={file.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors">
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-500/10 flex-shrink-0"><FileText size={14} className="text-indigo-400" /></div>
                  <span className="text-sm text-white truncate font-medium">{file.filename}</span>
                </div>
                <div className="col-span-2"><span className="text-xs text-slate-400">{formatBytes(file.file_size)}</span></div>
                <div className="col-span-2"><span className="text-xs text-slate-400">{formatDate(file.created_at)}</span></div>
                <div className="col-span-2">
                  {file.shares.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {file.shares.filter(s => s.is_active).slice(0,1).map(share => (
                        <div key={share.id} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{share.download_count} downloads</span>
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-xs text-slate-600">No shares</span>}
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <button onClick={() => setShareModal({ file })} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200" title="Share">
                    <Share2 size={13} />
                  </button>
                  {file.shares.length > 0 && file.shares[0].is_active && (
                    <>
                      <button onClick={() => setQrModal(file.shares[0].share_token)} className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200" title="QR Code">
                        <QrCode size={13} />
                      </button>
                      <button onClick={() => copyLink(file.shares[0].share_token)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" title="Copy link">
                        {copied ? <Check size={13} /> : <Link2 size={13} />}
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(file.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShareModal(null)} />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Share File</h2>
              <button onClick={() => setShareModal(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 mb-5">
              <FileText size={16} className="text-indigo-400 flex-shrink-0" />
              <span className="text-sm text-slate-300 truncate">{shareModal.file.filename}</span>
            </div>
            {!shareModal.token ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Expires after (hours)</label>
                  <input value={shareForm.expires_hours} onChange={e => setShareForm({...shareForm,expires_hours:e.target.value})} type="number" min="1" placeholder="24" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Max downloads (optional)</label>
                  <input value={shareForm.max_downloads} onChange={e => setShareForm({...shareForm,max_downloads:e.target.value})} type="number" min="1" placeholder="Unlimited" className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShareModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button onClick={handleShare} disabled={sharingFile} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50">{sharingFile ? 'Generating...' : 'Generate Share Link'}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <input readOnly value={shareLink(shareModal.token)} className="flex-1 bg-transparent text-xs text-slate-300 outline-none font-mono" />
                  <button onClick={() => copyLink(shareModal.token!)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <button onClick={() => setQrModal(shareModal.token!)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors">
                  <QrCode size={15} /> View QR Code
                </button>
                <button onClick={() => setShareModal(null)} className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQrModal(null)} />
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-xs border border-slate-700/50 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">QR Code</h2>
              <button onClick={() => setQrModal(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4 bg-white rounded-xl inline-block mb-4">
              <img src={`${BASE}/files/shared/${qrModal}/qr`} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <p className="text-xs text-slate-500">Scan to download the file</p>
            <a href={`${BASE}/files/shared/${qrModal}/download`} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-200">
              <Download size={14} /> Download Now
            </a>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
