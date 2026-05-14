import { randomUUID, createHash } from 'crypto';
import { Readable } from 'stream';
import { getStorageProvider, StorageProvider } from '@/lib/storage';
import { prisma } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────

export type UploadContext =
  | 'avatar'
  | 'admin'
  | 'rfq'
  | 'sample'
  | 'report'
  | 'certificate'
  | 'custom-testing'
  | 'settings'
  | 'general';

export interface MediaUploadOptions {
  context?: UploadContext;
  folder?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  /** Override max size (bytes) */
  maxSize?: number;
  /** Override allowed MIME types */
  allowedTypes?: string[];
  /** Whether to generate a thumbnail for images */
  generateThumbnail?: boolean;
  /** Max thumbnail width (default: 400) */
  thumbnailWidth?: number;
  /** Whether to convert images to WebP for optimization */
  convertToWebP?: boolean;
  /** Image quality for WebP conversion (1-100, default: 85) */
  webpQuality?: number;
  /** Whether to strip EXIF metadata from images */
  stripExif?: boolean;
}

/**
 * Standardized upload result object.
 * Guaranteed fields: { id, url, key, size, mimeType, filename, hash }
 */
export interface MediaUploadResult {
  id: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  filename: string;
  width?: number | null;
  height?: number | null;
  hash: string;
  thumbnailUrl?: string | null;
}

export interface MediaFileInfo {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface MediaListQuery {
  page?: number;
  pageSize?: number;
  context?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  mimeType?: string;
  search?: string;
}

export interface BatchUploadProgress {
  current: number;
  total: number;
  file: string;
  status: 'uploading' | 'done' | 'error';
  result?: MediaUploadResult;
  error?: string;
}

export type ProgressCallback = (progress: BatchUploadProgress) => void | Promise<void>;

// ─── Errors ──────────────────────────────────────────────────

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}

export class MediaNotFoundError extends Error {
  constructor(id: string) {
    super(`媒体文件不存在: ${id}`);
    this.name = 'MediaNotFoundError';
  }
}

export class MediaQuotaExceededError extends Error {
  constructor(limit: string) {
    super(`上传配额已超出限制: ${limit}`);
    this.name = 'MediaQuotaExceededError';
  }
}

export class MediaDuplicateError extends Error {
  constructor(public existingId: string) {
    super(`文件已存在 (hash 重复): ${existingId}`);
    this.name = 'MediaDuplicateError';
  }
}

export class MediaStorageError extends Error {
  constructor(message: string) {
    super(`存储操作失败: ${message}`);
    this.name = 'MediaStorageError';
  }
}

export class MediaSecurityError extends Error {
  constructor(message: string) {
    super(`安全验证失败: ${message}`);
    this.name = 'MediaSecurityError';
  }
}

// ─── Context-Aware Validation Rules ──────────────────────────

/**
 * Global MIME type whitelist.
 * Only JPEG, PNG, and PDF are permitted.
 * SVG is explicitly rejected to prevent XSS attacks.
 */
export const UPLOAD_RULES: Record<
  UploadContext,
  { allowedTypes: string[]; maxSize: number; label: string }
> = {
  avatar: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
    label: '头像',
  },
  admin: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '管理员上传',
  },
  rfq: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '需求附件',
  },
  sample: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024,
    label: '样品照片',
  },
  report: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '报告附件',
  },
  certificate: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '证书附件',
  },
  'custom-testing': {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '定制测试附件',
  },
  settings: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
    label: '站点设置',
  },
  general: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 50 * 1024 * 1024,
    label: '通用上传',
  },
};

// ─── Quota Configuration ─────────────────────────────────────

const QUOTA_CONFIG = {
  dailyMaxFiles: 100,
  dailyMaxBytes: 500 * 1024 * 1024, // 500MB/day
  monthlyMaxFiles: 2000,
  monthlyMaxBytes: 10 * 1024 * 1024 * 1024, // 10GB/month
};

// ─── Helpers ─────────────────────────────────────────────────

function getRules(context: UploadContext) {
  return UPLOAD_RULES[context] || UPLOAD_RULES.general;
}

/**
 * Map MIME type to canonical safe extension.
 * Derived from validated MIME type — never trusts the original filename.
 */
function getCanonicalExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',   // internal output format (convertToWebP)
    'application/pdf': 'pdf',
  };
  return map[mimeType] || 'bin';
}

function generateKey(mimeType: string, folder: string): string {
  const ext = getCanonicalExtension(mimeType);
  const uuid = randomUUID();
  return `${folder}/${uuid}.${ext}`;
}

function generateThumbnailKey(folder: string): string {
  const uuid = randomUUID();
  return `${folder}/thumb-${uuid}.webp`;
}

/**
 * Sanitize original filename for safe DB storage.
 * Strips path components, control characters, and limits length.
 */
function sanitizeFilename(name: string): string {
  // Strip path traversal attempts
  const base = name.replace(/\\/g, '/').split('/').pop() || 'unnamed';
  // Remove control characters and null bytes
  const clean = base.replace(/[\x00-\x1f\x7f]/g, '');
  // Collapse multiple dots to prevent double-extension confusion in UI
  const noDoubleExt = clean.replace(/\.{2,}/g, '.');
  // Append timestamp to prevent duplicate filename conflicts in storage
  const timestamp = Date.now();
  const lastDot = noDoubleExt.lastIndexOf('.');
  const stem = lastDot > 0 ? noDoubleExt.slice(0, lastDot) : noDoubleExt;
  const ext = lastDot > 0 ? noDoubleExt.slice(lastDot) : '';
  const withTimestamp = `${stem}-${timestamp}${ext}`;
  // Limit length
  return withTimestamp.slice(0, 255) || 'unnamed';
}

/**
 * Validate file magic bytes against claimed MIME type.
 * Prevents attackers from renaming executable files to whitelisted extensions.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  // Minimum bytes needed for any signature
  if (buffer.length < 8) return true; // Too small to validate; pass through

  const sigs: Record<string, (buf: Buffer) => boolean> = {
    'image/jpeg': (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    'image/png': (buf) =>
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
    'application/pdf': (buf) => buf.slice(0, 4).toString('ascii') === '%PDF',
  };

  const validator = sigs[mimeType];
  if (!validator) return true; // No magic-bytes check for this type; pass through
  return validator(buffer);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number; context?: string } = {}
): Promise<T> {
  const maxRetries = options.retries ?? 3;
  const baseDelay = options.delay ?? 300;
  const context = options.context ?? 'storage';

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[MediaService] ${context} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw new MediaStorageError(lastError?.message || '未知错误');
}

// ─── Image Processing ────────────────────────────────────────

interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

async function getImageInfo(buffer: Buffer): Promise<ImageInfo | null> {
  try {
    const sharp = require('sharp');
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return null;
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
    };
  } catch {
    return null;
  }
}

async function generateThumbnail(
  buffer: Buffer,
  maxWidth: number
): Promise<Buffer | null> {
  try {
    const sharp = require('sharp');
    return await sharp(buffer)
      .resize(maxWidth, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.warn('[MediaService] Thumbnail generation failed:', err);
    return null;
  }
}

async function optimizeImage(
  buffer: Buffer,
  quality: number,
  stripExif: boolean
): Promise<Buffer> {
  try {
    const sharp = require('sharp');
    let pipeline = sharp(buffer);
    if (stripExif) pipeline = pipeline.withMetadata({ exif: {} });
    return await pipeline.webp({ quality }).toBuffer();
  } catch {
    // Fallback: return original if sharp fails
    return buffer;
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// ─── MediaService ────────────────────────────────────────────

export class MediaService {
  private storage: StorageProvider;

  constructor(storage?: StorageProvider) {
    this.storage = storage || getStorageProvider();
  }

  // ── Validation ────────────────────────────────────────────

  validate(
    file: { size: number; mimeType: string },
    options?: MediaUploadOptions
  ): { valid: boolean; error?: string } {
    const context = options?.context || 'general';
    const rules = getRules(context);
    const maxSize = options?.maxSize ?? rules.maxSize;
    const allowedTypes = options?.allowedTypes ?? rules.allowedTypes;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小不能超过 ${formatFileSize(maxSize)}（当前: ${formatFileSize(file.size)}）`,
      };
    }

    // Explicit SVG rejection to prevent XSS
    if (file.mimeType === 'image/svg+xml') {
      return {
        valid: false,
        error: 'SVG 格式不支持上传：存在 XSS 攻击风险。请转换为 PNG 或 JPEG 后重试。',
      };
    }

    if (!allowedTypes.includes(file.mimeType)) {
      const typeNames = allowedTypes
        .map((t) => t.split('/').pop()?.toUpperCase())
        .filter(Boolean)
        .join('、');
      return {
        valid: false,
        error: `不支持的文件格式: ${file.mimeType}。${context === 'general' ? '' : `${rules.label}仅支持 ${typeNames}`}`,
      };
    }

    return { valid: true };
  }

  // ── Quotas ────────────────────────────────────────────────

  async checkQuota(uploadedBy: string, fileSize: number): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyStats, monthlyStats] = await Promise.all([
      prisma.media.aggregate({
        where: {
          uploadedBy,
          deletedAt: null,
          createdAt: { gte: startOfDay },
        },
        _count: { id: true },
        _sum: { size: true },
      }),
      prisma.media.aggregate({
        where: {
          uploadedBy,
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
        _count: { id: true },
        _sum: { size: true },
      }),
    ]);

    const dailyFiles = dailyStats._count.id;
    const dailyBytes = (dailyStats._sum.size as number | null) || 0;
    const monthlyFiles = monthlyStats._count.id;
    const monthlyBytes = (monthlyStats._sum.size as number | null) || 0;

    if (dailyFiles >= QUOTA_CONFIG.dailyMaxFiles) {
      throw new MediaQuotaExceededError(`每日最多 ${QUOTA_CONFIG.dailyMaxFiles} 个文件`);
    }
    if (dailyBytes + fileSize > QUOTA_CONFIG.dailyMaxBytes) {
      throw new MediaQuotaExceededError(`每日最多 ${formatFileSize(QUOTA_CONFIG.dailyMaxBytes)}`);
    }
    if (monthlyFiles >= QUOTA_CONFIG.monthlyMaxFiles) {
      throw new MediaQuotaExceededError(`每月最多 ${QUOTA_CONFIG.monthlyMaxFiles} 个文件`);
    }
    if (monthlyBytes + fileSize > QUOTA_CONFIG.monthlyMaxBytes) {
      throw new MediaQuotaExceededError(`每月最多 ${formatFileSize(QUOTA_CONFIG.monthlyMaxBytes)}`);
    }
  }

  // ── Duplicate Detection ───────────────────────────────────

  async findDuplicate(hash: string): Promise<{ id: string; url: string } | null> {
    if (!hash) return null;
    const existing = await prisma.media.findUnique({
      where: { hash },
      select: { id: true, url: true },
    });
    return existing;
  }

  // ── Upload ────────────────────────────────────────────────

  /**
   * Upload a file with full server-side processing:
   * - validation
   * - quota check
   * - hash deduplication
   * - image optimization + thumbnail
   * - storage upload (with retry)
   * - Media table persistence
   *
   * SECURITY: This is the ONLY path for storing files. Never expose
   * storage credentials or write-capable presigned URLs to clients.
   */
  async upload(
    file: MediaFileInfo,
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult> {
    // 1. Validate
    const validation = this.validate(file, options);
    if (!validation.valid) {
      throw new MediaValidationError(validation.error!);
    }

    const context = options?.context || 'general';
    const folder = options?.folder || context;
    const uploadedBy = options?.uploadedBy;

    // 2. Quota check
    if (uploadedBy) {
      await this.checkQuota(uploadedBy, file.size);
    }

    // 3. Magic bytes validation (security)
    if (!validateMagicBytes(file.buffer, file.mimeType)) {
      throw new MediaSecurityError(
        `文件内容与声明的格式不符: ${file.mimeType}。可能为伪造扩展名的文件。`
      );
    }

    // 4. Compute hash
    const hash = sha256(file.buffer);

    // 5. Deduplication check
    const duplicate = await this.findDuplicate(hash);
    if (duplicate) {
      // Return existing file reference instead of re-uploading
      const existing = await prisma.media.findUnique({
        where: { id: duplicate.id },
      });
      if (existing && !existing.deletedAt) {
        throw new MediaDuplicateError(duplicate.id);
      }
    }

    // 6. Image processing
    let processedBuffer = file.buffer;
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl: string | null = null;
    let thumbnailKey: string | null = null;
    let finalMimeType = file.mimeType;

    if (isImage(file.mimeType)) {
      // Extract dimensions
      const info = await getImageInfo(file.buffer);
      if (info) {
        width = info.width;
        height = info.height;
      }

      // Optional: convert to WebP
      if (options?.convertToWebP !== false && info && info.format !== 'webp') {
        try {
          processedBuffer = await optimizeImage(
            file.buffer,
            options?.webpQuality ?? 85,
            options?.stripExif !== false
          );
          finalMimeType = 'image/webp';
        } catch {
          // Keep original if optimization fails
        }
      }

      // Optional: generate thumbnail
      if (options?.generateThumbnail !== false && width && width > (options?.thumbnailWidth ?? 400)) {
        const thumbBuffer = await generateThumbnail(file.buffer, options?.thumbnailWidth ?? 400);
        if (thumbBuffer) {
          thumbnailKey = generateThumbnailKey(folder);
          try {
            const thumbResult = await withRetry(
              () => this.storage.upload(thumbBuffer, 'thumbnail.webp', 'image/webp', folder),
              { context: 'thumbnail-upload' }
            );
            thumbnailUrl = thumbResult.url;
          } catch (err) {
            console.warn('[MediaService] Thumbnail storage upload failed:', err);
            thumbnailKey = null;
          }
        }
      }
    }

    // 7. Generate storage key (UUID-only, extension from validated MIME type)
    const key = generateKey(finalMimeType, folder);

    // 8. Upload to storage (with retry)
    const safeFilename = sanitizeFilename(file.originalName);
    const storageResult = await withRetry(
      () => this.storage.upload(processedBuffer, safeFilename, finalMimeType, folder),
      { context: 'primary-upload' }
    );

    // 9. Persist to Media table
    let mediaRecord;
    try {
      mediaRecord = await prisma.media.create({
        data: {
          key: storageResult.key,
          url: storageResult.url,
          filename: safeFilename,
          mimeType: finalMimeType,
          size: processedBuffer.length,
          width,
          height,
          hash,
          thumbnailUrl,
          folder,
          provider: process.env.STORAGE_PROVIDER || 'local',
          context,
          entityType: options?.entityType || null,
          entityId: options?.entityId || null,
          uploadedBy: uploadedBy || null,
          metadata: {
            originalMimeType: file.mimeType,
            originalSize: file.size,
            thumbnailGenerated: !!thumbnailUrl,
            processed: processedBuffer !== file.buffer,
          },
        },
      });
    } catch (dbError) {
      // Rollback: try to delete from storage if DB fails
      console.error('[MediaService] DB insert failed, attempting storage cleanup:', dbError);
      try {
        await this.storage.delete(storageResult.key);
        if (thumbnailKey) await this.storage.delete(thumbnailKey);
      } catch (cleanupErr) {
        console.error('[MediaService] Storage cleanup also failed:', cleanupErr);
      }
      throw new MediaStorageError('数据库写入失败，已尝试清理存储文件');
    }

    // 10. Audit log — every successful upload MUST be recorded
    if (uploadedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: uploadedBy,
            action: 'UPLOAD_FILE',
            entity: 'FILE',
            entityId: mediaRecord.id,
            details: {
              url: storageResult.url,
              key: storageResult.key,
              size: processedBuffer.length,
              mimeType: finalMimeType,
              folder,
              context,
              thumbnailGenerated: !!thumbnailUrl,
            },
          },
        });
      } catch (auditErr) {
        // Audit failures must never break the upload response
        console.error('[MediaService] Audit log write failed:', auditErr);
      }
    }

    return {
      id: mediaRecord.id,
      url: storageResult.url,
      key: storageResult.key,
      size: processedBuffer.length,
      mimeType: finalMimeType,
      filename: safeFilename,
      width,
      height,
      hash,
      thumbnailUrl,
    };
  }

  /**
   * Upload from a Base64 data URL (e.g. from rich text editor or canvas).
   */
  async uploadFromBase64(
    dataUrl: string,
    originalName: string,
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult> {
    const match = dataUrl.match(/^data:([\w\/+.-]+);base64,(.+)$/);
    if (!match) {
      throw new MediaValidationError('无效的 Base64 Data URL 格式');
    }

    const mimeType = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    return this.upload(
      { buffer, originalName, mimeType, size: buffer.length },
      options
    );
  }

  /**
   * Upload from a Node.js Readable stream.
   * Buffers the entire stream — suitable for moderate-sized files.
   * For very large files, consider direct streaming to storage.
   */
  async uploadFromStream(
    stream: Readable,
    originalName: string,
    mimeType: string,
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const result = await this.upload(
            { buffer, originalName, mimeType, size: buffer.length },
            options
          );
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      stream.on('error', (err) => reject(new MediaStorageError(`流读取失败: ${err.message}`)));
    });
  }

  /**
   * Batch upload multiple files with optional progress callback.
   */
  async uploadMany(
    files: MediaFileInfo[],
    options?: MediaUploadOptions,
    onProgress?: ProgressCallback
  ): Promise<{ results: MediaUploadResult[]; errors: { file: string; error: string }[] }> {
    const results: MediaUploadResult[] = [];
    const errors: { file: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (onProgress) {
        await onProgress({ current: i + 1, total: files.length, file: file.originalName, status: 'uploading' });
      }

      try {
        const result = await this.upload(file, options);
        results.push(result);
        if (onProgress) {
          await onProgress({ current: i + 1, total: files.length, file: file.originalName, status: 'done', result });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '上传失败';
        errors.push({ file: file.originalName, error: msg });
        if (onProgress) {
          await onProgress({ current: i + 1, total: files.length, file: file.originalName, status: 'error', error: msg });
        }
      }
    }

    return { results, errors };
  }

  // ── Read ──────────────────────────────────────────────────

  async getById(id: string) {
    return prisma.media.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async getByKey(key: string) {
    return prisma.media.findUnique({
      where: { key },
    });
  }

  async list(query: MediaListQuery = {}) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deletedAt: null };

    if (query.context) where.context = query.context;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.uploadedBy) where.uploadedBy = query.uploadedBy;
    if (query.mimeType) where.mimeType = query.mimeType;
    if (query.search) {
      (where as any).OR = [
        { filename: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Delete ────────────────────────────────────────────────

  /**
   * Soft-delete a media record and remove from storage (with retry).
   */
  async delete(id: string): Promise<void> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new MediaNotFoundError(id);

    // Delete from storage
    try {
      await withRetry(() => this.storage.delete(media.key), { context: 'storage-delete' });
    } catch (err) {
      console.warn(`[MediaService] Storage delete failed for key ${media.key}:`, err);
    }

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbKey = media.thumbnailUrl.split('/').pop();
      if (thumbKey) {
        try {
          const folder = media.folder;
          await withRetry(() => this.storage.delete(`${folder}/${thumbKey}`), { context: 'thumbnail-delete' });
        } catch {
          // Ignore thumbnail cleanup failures
        }
      }
    }

    // Soft-delete in DB
    await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Permanently delete a media record (use with caution).
   */
  async hardDelete(id: string): Promise<void> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new MediaNotFoundError(id);

    try {
      await withRetry(() => this.storage.delete(media.key), { context: 'storage-hard-delete' });
    } catch (err) {
      console.warn(`[MediaService] Storage hard delete failed for key ${media.key}:`, err);
    }

    if (media.thumbnailUrl) {
      const thumbKey = media.thumbnailUrl.split('/').pop();
      if (thumbKey) {
        try {
          const folder = media.folder;
          await this.storage.delete(`${folder}/${thumbKey}`);
        } catch {
          // Ignore
        }
      }
    }

    await prisma.media.delete({ where: { id } });
  }

  /**
   * Delete multiple media records.
   */
  async deleteMany(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        await this.delete(id);
        deleted++;
      } catch {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }

  // ── Cleanup ───────────────────────────────────────────────

  /**
   * Find orphaned media files — records whose entity no longer exists.
   */
  async findOrphans(): Promise<string[]> {
    const orphanIds: string[] = [];

    const mediaList = await prisma.media.findMany({
      where: { deletedAt: null, entityType: { not: null }, entityId: { not: null } },
      select: { id: true, entityType: true, entityId: true, key: true },
    });

    for (const media of mediaList) {
      const { entityType, entityId } = media;
      if (!entityType || !entityId) continue;

      let exists = false;
      try {
        switch (entityType) {
          case 'RFQ':
            exists = (await prisma.rFQFile.count({ where: { id: entityId } })) > 0;
            break;
          case 'OrderDocument':
            exists = (await prisma.orderDocument.count({ where: { id: entityId } })) > 0;
            break;
          case 'SamplePhoto':
            exists = (await prisma.samplePhoto.count({ where: { id: entityId } })) > 0;
            break;
          case 'ReportAttachment':
            exists = (await prisma.reportAttachment.count({ where: { id: entityId } })) > 0;
            break;
          case 'CertificateAttachment':
            exists = (await prisma.certificateAttachment.count({ where: { id: entityId } })) > 0;
            break;
          case 'CustomTestingAttachment':
            exists = (await prisma.customTestingAttachment.count({ where: { id: entityId } })) > 0;
            break;
          case 'LabMedia':
            exists = (await prisma.labMedia.count({ where: { id: entityId } })) > 0;
            break;
          case 'User':
            exists = (await prisma.user.count({ where: { id: entityId, avatar: { contains: media.key } } })) > 0;
            break;
          default:
            exists = true;
        }
      } catch {
        exists = true;
      }

      if (!exists) {
        orphanIds.push(media.id);
      }
    }

    return orphanIds;
  }

  /**
   * Clean up orphaned media files.
   */
  async cleanupOrphans(): Promise<{ cleaned: number; ids: string[] }> {
    const orphanIds = await this.findOrphans();
    let cleaned = 0;

    for (const id of orphanIds) {
      try {
        await this.delete(id);
        cleaned++;
      } catch (err) {
        console.warn(`[MediaService] Failed to clean up orphan ${id}:`, err);
      }
    }

    return { cleaned, ids: orphanIds };
  }

  // ── Track existing upload ─────────────────────────────────

  /**
   * Track an already-uploaded file in the Media table.
   * Use this when the file was uploaded via a legacy route.
   */
  async track(
    file: MediaFileInfo,
    storageResult: { url: string; key: string },
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult> {
    const context = options?.context || 'general';
    const folder = options?.folder || context;
    const hash = sha256(file.buffer);

    let width: number | null = null;
    let height: number | null = null;

    if (isImage(file.mimeType)) {
      const info = await getImageInfo(file.buffer);
      if (info) {
        width = info.width;
        height = info.height;
      }
    }

    const safeFilename = sanitizeFilename(file.originalName);

    const mediaRecord = await prisma.media.create({
      data: {
        key: storageResult.key,
        url: storageResult.url,
        filename: safeFilename,
        mimeType: file.mimeType,
        size: file.size,
        width,
        height,
        hash,
        folder,
        provider: process.env.STORAGE_PROVIDER || 'local',
        context,
        entityType: options?.entityType || null,
        entityId: options?.entityId || null,
        uploadedBy: options?.uploadedBy || null,
        metadata: { tracked: true, originalMimeType: file.mimeType },
      },
    });

    return {
      id: mediaRecord.id,
      url: storageResult.url,
      key: storageResult.key,
      size: file.size,
      mimeType: file.mimeType,
      filename: safeFilename,
      width,
      height,
      hash,
    };
  }

  // ── Migration Helpers ─────────────────────────────────────

  /**
   * Backfill Media records from legacy entity-specific tables.
   * Useful for migrating existing uploads into the unified Media system.
   */
  async backfillFromLegacyTables(): Promise<{
    total: number;
    created: number;
    errors: number;
  }> {
    let total = 0;
    let created = 0;
    let errors = 0;

    // Helper to process a batch
    const processBatch = async (
      items: Array<{ id: string; fileName: string; fileUrl: string; fileType?: string | null; fileSize?: number | null; createdAt?: Date }>,
      entityType: string
    ) => {
      for (const item of items) {
        total++;
        try {
          // Skip if already tracked
          const existing = await prisma.media.findFirst({
            where: { url: item.fileUrl, deletedAt: null },
          });
          if (existing) continue;

          await prisma.media.create({
            data: {
              key: item.fileUrl.replace(/^.*\//, ''),
              url: item.fileUrl,
              filename: item.fileName,
              mimeType: item.fileType || 'application/octet-stream',
              size: item.fileSize || 0,
              folder: 'legacy',
              provider: process.env.STORAGE_PROVIDER || 'local',
              context: 'general',
              entityType,
              entityId: item.id,
              createdAt: item.createdAt || new Date(),
              metadata: { backfilled: true, source: entityType },
            },
          });
          created++;
        } catch {
          errors++;
        }
      }
    };

    // RFQ Files
    const rfqFiles = await prisma.rFQFile.findMany({
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, uploadedAt: true },
    });
    await processBatch(
      rfqFiles.map((f) => ({ ...f, createdAt: f.uploadedAt })),
      'RFQ'
    );

    // Order Documents
    const orderDocs = await prisma.orderDocument.findMany({
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, createdAt: true },
    });
    await processBatch(orderDocs, 'OrderDocument');

    // Sample Photos
    const samplePhotos = await prisma.samplePhoto.findMany({
      select: { id: true, photoUrl: true, caption: true, uploadedAt: true },
    });
    await processBatch(
      samplePhotos.map((p) => ({
        id: p.id,
        fileName: p.caption || 'photo.jpg',
        fileUrl: p.photoUrl,
        fileType: 'image/jpeg',
        fileSize: null,
        createdAt: p.uploadedAt,
      })),
      'SamplePhoto'
    );

    // Report Attachments
    const reportAttachments = await prisma.reportAttachment.findMany({
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, createdAt: true },
    });
    await processBatch(reportAttachments, 'ReportAttachment');

    // Certificate Attachments
    const certAttachments = await prisma.certificateAttachment.findMany({
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, createdAt: true },
    });
    await processBatch(certAttachments, 'CertificateAttachment');

    // Custom Testing Attachments
    const customTestingAttachments = await prisma.customTestingAttachment.findMany({
      select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, createdAt: true },
    });
    await processBatch(customTestingAttachments, 'CustomTestingAttachment');

    // Lab Media
    const labMedia = await prisma.labMedia.findMany({
      select: { id: true, url: true, caption: true, createdAt: true },
    });
    await processBatch(
      labMedia.map((m) => ({
        id: m.id,
        fileName: m.caption || 'media.jpg',
        fileUrl: m.url,
        fileType: 'image/jpeg',
        fileSize: null,
        createdAt: m.createdAt,
      })),
      'LabMedia'
    );

    return { total, created, errors };
  }

  // ── Storage delegation ────────────────────────────────────

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return withRetry(() => this.storage.getSignedUrl(key, expiresIn), { context: 'signed-url' });
  }
}

// ─── Singleton export ────────────────────────────────────────

let _mediaService: MediaService | null = null;

export function getMediaService(): MediaService {
  if (!_mediaService) {
    _mediaService = new MediaService();
  }
  return _mediaService;
}
