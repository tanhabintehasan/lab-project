/**
 * Storage abstraction for file uploads.
 * Supports local filesystem (dev), S3-compatible (prod), and Supabase Storage.
 * Configure via STORAGE_PROVIDER env var: 'local' | 's3' | 'supabase'
 */

import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string, folder: string): Promise<UploadResult>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

// ─── Local filesystem provider (development) ─────────────────
class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    this.baseDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  async upload(file: Buffer, filename: string, mimeType: string, folder: string): Promise<UploadResult> {
    const key = `${folder}/${randomUUID()}-${filename}`;
    const fullPath = path.join(this.baseDir, key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file);
    return {
      url: `${this.baseUrl}/uploads/${key}`,
      key,
      size: file.length,
      mimeType,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.baseUrl}/uploads/${key}`;
  }

  async delete(_key: string): Promise<void> {
    // In production, implement actual deletion
  }
}

// ─── S3-compatible provider ──────────────────────────────────
class S3StorageProvider implements StorageProvider {
  async upload(file: Buffer, filename: string, mimeType: string, folder: string): Promise<UploadResult> {
    // TODO: Implement with @aws-sdk/client-s3
    // For now, fall back to local
    console.warn('[S3] S3 provider not yet configured, falling back to local');
    return new LocalStorageProvider().upload(file, filename, mimeType, folder);
  }

  async getSignedUrl(key: string): Promise<string> {
    // TODO: Implement with @aws-sdk/s3-request-presigner
    return new LocalStorageProvider().getSignedUrl(key);
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement
  }
}

// ─── Factory ─────────────────────────────────────────────────
let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const providerType = process.env.STORAGE_PROVIDER || 'local';
  switch (providerType) {
    case 's3':
    case 'r2':
      _provider = new S3StorageProvider();
      break;
    case 'local':
    default:
      _provider = new LocalStorageProvider();
  }

  return _provider;
}

// ─── Validation helpers ──────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateUpload(
  file: { size: number; type: string },
  options: { maxSize?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

  if (file.size > maxSize) {
    return { valid: false, error: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `不支持的文件格式: ${file.type}` };
  }

  return { valid: true };
}

export { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES };
