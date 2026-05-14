'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, Search, Loader2 } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
}

export function MediaPicker({ isOpen, onClose, onSelect, folder = 'cms' }: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '12',
        mimeType: 'image',
      });
      if (search) params.set('q', search);
      const res = await fetch(`/api/admin/media?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data?.success) {
        setMediaItems(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error('Fetch media error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      fetchMedia();
    }
  }, [isOpen, activeTab, fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('entityType', 'CMS');
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();
        if (data?.success && data.data?.url) {
          uploadedUrls.push(data.data.url);
        } else {
          setUploadError(data?.error || '上传失败');
        }
      } catch {
        setUploadError('上传失败');
      }
    }

    setUploading(false);
    if (uploadedUrls.length === 1) {
      onSelect(uploadedUrls[0]);
      onClose();
    } else if (uploadedUrls.length > 1) {
      // Switch to library to let user pick which one
      setActiveTab('library');
      fetchMedia();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const handleSelect = () => {
    const item = mediaItems.find((m) => m.id === selectedId);
    if (item) {
      onSelect(item.url);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="选择图片" size="xl">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            媒体库
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            上传图片
          </button>
        </div>

        {activeTab === 'library' ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索图片..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ImageIcon className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-sm">暂无图片</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab('upload')}>
                  <Upload className="mr-1 h-4 w-4" />
                  上传图片
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                      selectedId === item.id
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {selectedId === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-[10px] text-white truncate">{item.filename}</p>
                      <p className="text-[9px] text-gray-300">{formatSize(item.size)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleSelect} disabled={!selectedId}>
                选择图片
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Dropzone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                拖放图片到此处，或
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 ml-1 font-medium"
                >
                  点击选择
                </button>
              </p>
              <p className="text-xs text-gray-400">支持 JPG、PNG、WebP，最大 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                上传中...
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setActiveTab('library')}>
                返回媒体库
              </Button>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
