'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  folder?: string;
  entityType?: 'rfq' | 'report' | 'sample' | 'avatar';
  entityId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadedFile;
}

export function FileUpload({
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  maxSize = 50 * 1024 * 1024,
  multiple = false,
  folder = 'general',
  entityType,
  entityId,
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    const formData = new FormData();
    formData.append('file', fileWithProgress.file);
    formData.append('folder', folder);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        return data.data.file as UploadedFile;
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('上传失败');
    }
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Validate files
    const validFiles: FileWithProgress[] = [];
    for (const file of fileArray) {
      if (file.size > maxSize) {
        onUploadError?.(`文件 ${file.name} 大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`);
        continue;
      }
      validFiles.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }

    setFiles(prev => [...prev, ...validFiles]);

    // Upload files
    const uploadedFiles: UploadedFile[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const fileWithProgress = validFiles[i];
      const idx = files.length + i;

      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[idx] = { ...newFiles[idx], status: 'uploading', progress: 50 };
        return newFiles;
      });

      try {
        const result = await uploadFile(fileWithProgress);
        uploadedFiles.push(result);

        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[idx] = { ...newFiles[idx], status: 'success', progress: 100, result };
          return newFiles;
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '上传失败';
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[idx] = { ...newFiles[idx], status: 'error', error: errorMsg };
          return newFiles;
        });
        onUploadError?.(errorMsg);
      }
    }

    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          拖放文件到此处，或
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 ml-1"
          >
            点击选择文件
          </button>
        </p>
        <p className="text-xs text-gray-400">
          支持的格式: {accept.split(',').slice(0, 3).join(', ')}
          {accept.split(',').length > 3 && ' 等'}
        </p>
        <p className="text-xs text-gray-400">
          最大大小: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileWithProgress, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0 text-gray-500">
                {getFileIcon(fileWithProgress.file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileWithProgress.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileWithProgress.file.size)}
                </p>
                {fileWithProgress.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${fileWithProgress.progress}%` }}
                    />
                  </div>
                )}
                {fileWithProgress.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{fileWithProgress.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {fileWithProgress.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {fileWithProgress.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {fileWithProgress.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
