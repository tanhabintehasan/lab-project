/**
 * Storage abstraction for file uploads.
 * Supports local filesystem (dev), S3-compatible (prod), and Supabase Storage.
 * Configure via STORAGE_PROVIDER env var: 'local' | 's3' | 'r2' | 'dataurl'
 *
 * For S3/R2 support, install the AWS SDK:
 *   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { randomUUID } from 'crypto';
import { writeFile, mkdir, unlink } from 'fs/promises';
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

  constructor() {
    this.baseDir = process.env.UPLOAD_DIR || './public/uploads';
  }

  async upload(file: Buffer, filename: string, mimeType: string, folder: string): Promise<UploadResult> {
    const key = `${folder}/${randomUUID()}-${filename}`;
    const fullPath = path.join(this.baseDir, key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file);
    return {
      url: `/uploads/${key}`,
      key,
      size: file.length,
      mimeType,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    try {
      await unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

// ─── Base64 Data URL provider (serverless fallback) ──────────
class DataUrlStorageProvider implements StorageProvider {
  private maxSize: number;

  constructor(maxSize = 100 * 1024) {
    this.maxSize = maxSize; // 100KB default
  }

  async upload(file: Buffer, filename: string, mimeType: string, _folder: string): Promise<UploadResult> {
    if (file.length > this.maxSize) {
      throw new Error(`File too large for data URL storage (max ${this.maxSize / 1024}KB)`);
    }
    const base64 = file.toString('base64');
    const url = `data:${mimeType};base64,${base64}`;
    return {
      url,
      key: filename,
      size: file.length,
      mimeType,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return key;
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }
}

// ─── S3-compatible provider (S3 / R2 / MinIO) ────────────────
class S3StorageProvider implements StorageProvider {
  private client: any;
  private bucket: string;
  private endpoint: string;
  private publicUrlBase: string;
  private initialized = false;

  constructor() {
    this.bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET || '';
    this.endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || '';
    this.publicUrlBase = process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';
  }

  private async init() {
    if (this.initialized) return;
    try {
      // Runtime require to avoid build-time dependency on AWS SDK
      const s3Module = require('@aws-sdk/client-s3');
      const signerModule = require('@aws-sdk/s3-request-presigner');

      this.client = new s3Module.S3Client({
        endpoint: this.endpoint || undefined,
        region: process.env.S3_REGION || process.env.AWS_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: !!this.endpoint,
      });

      (this as any)._put = s3Module.PutObjectCommand;
      (this as any)._get = s3Module.GetObjectCommand;
      (this as any)._delete = s3Module.DeleteObjectCommand;
      (this as any)._sign = signerModule.getSignedUrl;

      this.initialized = true;
    } catch (err) {
      console.error('[S3] Failed to initialize S3 client. Did you install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner?', err);
      throw new Error('S3 storage provider is not available. Install the AWS SDK or check your environment variables.');
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string, folder: string): Promise<UploadResult> {
    await this.init();
    const key = `${folder}/${randomUUID()}-${filename}`;
    const command = new (this as any)._put({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });
    await this.client.send(command);

    const url = this.publicUrlBase
      ? `${this.publicUrlBase.replace(/\/$/, '')}/${key}`
      : `${this.endpoint}/${this.bucket}/${key}`;

    return { url, key, size: file.length, mimeType };
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    await this.init();
    const command = new (this as any)._get({
      Bucket: this.bucket,
      Key: key,
    });
    return (this as any)._sign(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    const command = new (this as any)._delete({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }
}

// ─── Factory ─────────────────────────────────────────────────
let _provider: StorageProvider | null = null;

export function getStorageProvider(forceType?: string): StorageProvider {
  if (_provider && !forceType) return _provider;

  const providerType = forceType || process.env.STORAGE_PROVIDER || 'local';
  switch (providerType) {
    case 's3':
    case 'r2':
      if (!forceType) {
        _provider = new S3StorageProvider();
        return _provider;
      }
      return new S3StorageProvider();
    case 'dataurl':
      return new DataUrlStorageProvider();
    case 'local':
    default:
      if (!forceType) {
        _provider = new LocalStorageProvider();
        return _provider;
      }
      return new LocalStorageProvider();
  }
}

// ─── Validation helpers ──────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
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
