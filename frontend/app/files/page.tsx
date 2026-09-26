'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import {
  Upload, FileText, Share2, Download, Trash2, X, Copy,
  Check, QrCode, Link2, FolderOpen, AlertCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { SkeletonRow } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

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
  const [qrModalToken, setQrModalToken] = useState<string | null>(null);
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

  const getFullShareUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/share/${token}`;
    }
    return `/share/${token}`;
  };

  const copyLink = (token: string) => {
    const link = getFullShareUrl(token);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#36362F]">
          <div>
            <h1 className="text-xl font-bold text-[#FFFBF4] tracking-tight font-display">QR File Sharing</h1>
            <p className="text-[#8D8777] text-xs mt-0.5">Upload notes, PDFs, or assignments and generate secure scannable QR codes</p>
          </div>
        </div>

        {error && (
          <div className="sh-alert-danger">
            <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-[#8E9B7A] bg-[#282F24]/40'
              : 'border-[#36362F] bg-[#1C1C17] hover:border-[#565449] hover:bg-[#24241E]/40'
          }`}
        >
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#8E9B7A] border-t-transparent animate-spin" />
              <p className="text-[#FFFBF4] text-xs font-medium">Uploading file...</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-[#24241E] border border-[#36362F] text-[#8E9B7A]">
                <Upload size={20} strokeWidth={1.75} />
              </div>
              <div className="text-center">
                <p className="text-[#FFFBF4] text-xs font-semibold">Click or drag file here to upload</p>
                <p className="text-[#8D8777] text-[11px] mt-0.5">Supports PDF, DOCX, Code, Images, ZIP</p>
              </div>
            </>
          )}
        </div>

        {/* Files List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files uploaded yet"
            description="Uploaded study notes, assignments, and generated QR links will appear here."
            action={{
              label: 'Upload File',
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        ) : (
          <div className="sh-card rounded-xl overflow-hidden border border-[#36362F]">
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-[#36362F] bg-[#24241E] text-[11px] font-semibold text-[#8D8777]">
              <div className="col-span-5">File</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y divide-[#36362F]">
              {files.map((file) => {
                const shares = file.shares || [];
                const activeShare = shares.find((s) => s.is_active) || shares[0];
                return (
                  <div key={file.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#24241E]/40 transition-colors">
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-md bg-[#24241E] text-[#8E9B7A] flex-shrink-0">
                        <FileText size={15} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#FFFBF4] truncate">{file.filename}</p>
                        {activeShare && (
                          <p className="text-[10px] text-[#8E9B7A] mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8E9B7A]" />
                            Active QR ({activeShare.download_count} dl)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-[#8D8777]">{formatBytes(file.file_size)}</div>
                    <div className="col-span-2 text-xs text-[#8D8777]">{formatDate(file.created_at)}</div>
                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setShareModal({ file })}
                        className="sh-btn-secondary px-2 py-1 text-xs gap-1"
                        title="Create or View Share Link"
                      >
                        <Share2 size={13} strokeWidth={1.75} />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      {activeShare && (
                        <>
                          <button
                            onClick={() => setQrModalToken(activeShare.share_token)}
                            className="p-1.5 rounded-md text-[#D8CFBC] hover:text-[#FFFBF4] hover:bg-[#24241E] border border-transparent hover:border-[#36362F] transition-colors"
                            title="Show Scannable QR Code"
                          >
                            <QrCode size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => copyLink(activeShare.share_token)}
                            className="p-1.5 rounded-md text-[#D8CFBC] hover:text-[#8E9B7A] hover:bg-[#24241E] border border-transparent hover:border-[#36362F] transition-colors"
                            title="Copy Share Link"
                          >
                            {copied ? <Check size={14} className="text-[#8E9B7A]" strokeWidth={2} /> : <Link2 size={14} strokeWidth={1.75} />}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 rounded-md text-[#8D8777] hover:text-[#C76A5E] hover:bg-[#C76A5E]/10 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="sh-glass-strong rounded-2xl p-6 w-full max-w-sm border border-[#36362F] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#36362F] mb-4">
              <h2 className="text-sm font-semibold text-[#FFFBF4]">Share File via QR Link</h2>
              <button onClick={() => setShareModal(null)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#11120D] border border-[#36362F] mb-4">
              <FileText size={15} className="text-[#8E9B7A] flex-shrink-0" strokeWidth={1.75} />
              <span className="text-xs text-[#D8CFBC] font-medium truncate">{shareModal.file.filename}</span>
            </div>

            {!shareModal.token ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#8D8777] mb-1">Expiration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={shareForm.expires_hours}
                    onChange={(e) => setShareForm({ ...shareForm, expires_hours: e.target.value })}
                    className="sh-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#8D8777] mb-1">Max Downloads (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={shareForm.max_downloads}
                    onChange={(e) => setShareForm({ ...shareForm, max_downloads: e.target.value })}
                    className="sh-input"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShareModal(null)}
                    className="sh-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharingFile}
                    className="sh-btn-primary flex-1 disabled:opacity-50"
                  >
                    {sharingFile ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#11120D] border border-[#36362F]">
                  <p className="text-[10px] text-[#8D8777] mb-1">Public Share Link:</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={getFullShareUrl(shareModal.token)}
                      className="flex-1 bg-transparent text-[11px] font-mono text-[#D8CFBC] outline-none truncate"
                    />
                    <button
                      onClick={() => copyLink(shareModal.token!)}
                      className="p-1 rounded hover:bg-[#24241E] text-[#8D8777]"
                    >
                      {copied ? <Check size={13} className="text-[#8E9B7A]" strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setQrModalToken(shareModal.token!)}
                  className="sh-btn-sage w-full gap-1.5"
                >
                  <QrCode size={13} strokeWidth={1.75} /> View QR Code
                </button>

                <button
                  onClick={() => setShareModal(null)}
                  className="sh-btn-secondary w-full"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal (Instant Client-side Rendered SVG) */}
      {qrModalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="sh-glass-strong rounded-2xl p-6 w-full max-w-xs text-center border border-[#36362F] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#36362F] mb-4">
              <h3 className="text-xs font-semibold text-[#FFFBF4]">Scannable QR Code</h3>
              <button onClick={() => setQrModalToken(null)} className="text-[#8D8777] hover:text-[#FFFBF4]">
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            
            {/* Pure white solid container so all cameras can scan the QR code effortlessly */}
            <div className="p-4 bg-white rounded-xl inline-block border border-[#36362F] mb-3 shadow-lg">
              <QRCode
                value={getFullShareUrl(qrModalToken)}
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 180 180`}
              />
            </div>

            <p className="text-[11px] text-[#8D8777] mb-3">Scan with any phone camera to access and download the file immediately.</p>
            
            <button
              onClick={() => copyLink(qrModalToken)}
              className="sh-btn-primary w-full gap-1.5"
            >
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
              <span>{copied ? 'Link Copied' : 'Copy Direct Link'}</span>
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
