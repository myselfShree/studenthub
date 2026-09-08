'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Upload, FileText, Share2, Download, Trash2, X, Copy,
  Check, QrCode, Link2, Loader2, FolderOpen, AlertCircle
} from 'lucide-react';

interface FileItem {
  id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  shares?: ShareItem[];
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
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    try {
      const data = await api.get('/files');
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload('/files/upload', formData);
      fetchFiles();
    } catch {
      setError('Upload failed. Check file format and size.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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
    } catch {
      setError('Share link creation failed');
    } finally {
      setSharingFile(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${id}`);
      fetchFiles();
    } catch {
      setError('Delete failed');
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = (token: string) => `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/share/${token}`;
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#30363d]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">QR File Sharing</h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Upload notes, PDFs, or assignments and generate secure QR codes</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed transition-all duration-150 cursor-pointer p-8 flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={28} />
              <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">Uploading file...</p>
            </>
          ) : (
            <>
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Upload size={20} />
              </div>
              <div className="text-center">
                <p className="text-slate-900 dark:text-white text-xs font-medium">Click or drag file here to upload</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Supports PDF, DOCX, Code, Images, ZIP</p>
              </div>
            </>
          )}
        </div>

        {/* Files Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
        ) : files.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#21262d] text-slate-600 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderOpen size={20} />
            </div>
            <p className="text-slate-900 dark:text-white text-xs font-medium">No files uploaded yet</p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">Uploaded files and QR links will appear here.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#1c2128] text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="col-span-5">File</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-[#30363d]">
              {files.map((file) => {
                const shares = file.shares || [];
                const activeShare = shares.find((s) => s.is_active) || shares[0];
                return (
                  <div key={file.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50/80 dark:hover:bg-[#1c2128]/50 transition-colors">
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{file.filename}</p>
                        {activeShare && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Active QR ({activeShare.download_count} dl)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-slate-600 dark:text-slate-400">{formatBytes(file.file_size)}</div>
                    <div className="col-span-2 text-xs text-slate-600 dark:text-slate-400">{formatDate(file.created_at)}</div>
                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setShareModal({ file })}
                        className="px-2 py-1 rounded text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-1"
                        title="Create or View Share Link"
                      >
                        <Share2 size={13} />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      {activeShare && (
                        <>
                          <button
                            onClick={() => setQrModal(activeShare.share_token)}
                            className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
                            title="Show QR Code"
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            onClick={() => copyLink(activeShare.share_token)}
                            className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
                            title="Copy Share Link"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Link2 size={14} />}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-panel rounded-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#30363d] mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Share File via QR Link</h2>
              <button onClick={() => setShareModal(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#1c2128] border border-slate-200 dark:border-[#30363d] mb-4">
              <FileText size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">{shareModal.file.filename}</span>
            </div>

            {!shareModal.token ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Expiration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={shareForm.expires_hours}
                    onChange={(e) => setShareForm({ ...shareForm, expires_hours: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Max Downloads (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={shareForm.max_downloads}
                    onChange={(e) => setShareForm({ ...shareForm, max_downloads: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShareModal(null)}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharingFile}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                  >
                    {sharingFile ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">Public Share Link:</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={shareLink(shareModal.token)}
                      className="flex-1 bg-transparent text-[11px] font-mono text-slate-800 dark:text-slate-200 outline-none truncate"
                    />
                    <button
                      onClick={() => copyLink(shareModal.token!)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-600 dark:text-slate-400"
                    >
                      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setQrModal(shareModal.token!)}
                  className="w-full py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center gap-1.5"
                >
                  <QrCode size={13} /> View QR Code
                </button>

                <button
                  onClick={() => setShareModal(null)}
                  className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-[#21262d] text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-[#30363d]"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-panel rounded-xl p-5 w-full max-w-xs text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#30363d] mb-4">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">QR Code</h3>
              <button onClick={() => setQrModal(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 bg-white rounded-lg inline-block border border-slate-200 dark:border-slate-700 mb-3 shadow-sm">
              <img src={`${BASE}/files/shared/${qrModal}/qr`} alt="QR Code" className="w-44 h-44 object-contain mx-auto" />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">Scan with any phone camera to access and download the file.</p>
            <a
              href={`${BASE}/files/shared/${qrModal}/download`}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={13} /> Download File
            </a>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
