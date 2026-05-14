# Global Media & Upload System

## Overview

A unified, enterprise-grade file upload system that tracks all uploaded files in a central `Media` table. Features server-side image processing (`sharp`), SHA-256 duplicate detection, per-user upload quotas, automatic thumbnail generation, and robust retry logic with transaction-safe storage operations.

Supports local filesystem and Alibaba OSS storage backends.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Client        │────▶│   API Routes     │────▶│      MediaService        │
│  (no direct     │     │  (auth + role)   │     │  (validate + process +   │
│   uploads)      │     │                  │     │   dedup + quota + store) │
└─────────────────┘     └──────────────────┘     └──────────────────────────┘
                                                          │
                              ┌───────────────────────────┼───────────┐
                              ▼                           ▼           ▼
                        ┌──────────┐               ┌──────────┐  ┌──────────┐
                        │  Local   │               │  Alibaba │  │  Media   │
                        │  Storage │               │   OSS    │  │   Table  │
                        │(dev/test)│               │  (prod)  │  │(tracking)│
                        └──────────┘               └──────────┘  └──────────┘
                              ▲
                              │
                        ┌──────────┐
                        │ Thumbnail│
                        │ Storage  │
                        └──────────┘
```

---

## Database Model

```prisma
model Media {
  id           String    @id @default(cuid())
  key          String    @unique      // storage path (UUID filename)
  url          String                 // public URL
  filename     String                 // original filename
  mimeType     String
  size         Int                    // final stored size (may differ after processing)
  width        Int?                   // image width (sharp)
  height       Int?                   // image height (sharp)
  hash         String?   @unique      // SHA-256 of file content
  thumbnailUrl String?                // generated thumbnail URL
  metadata     Json?                  // processing metadata (originalMimeType, etc.)
  folder       String    @default("general")
  provider     String    @default("local")  // local | oss | s3
  context      String    @default("general") // avatar | admin | rfq | ...
  entityType   String?                  // linked model name
  entityId     String?                  // linked model ID
  uploadedBy   String?                  // uploader user ID
  deletedAt    DateTime?                // soft delete
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @default(now()) @updatedAt

  @@index([context])
  @@index([entityType, entityId])
  @@index([uploadedBy])
  @@index([key])
  @@index([hash])
  @@index([deletedAt])
  @@index([createdAt])
}
```

---

## Upload Contexts & Validation Rules

| Context | Allowed Types | Max Size | Label |
|---------|--------------|----------|-------|
| `avatar` | JPEG, PNG | 5MB | 头像 |
| `admin` | JPEG, PNG, PDF | 50MB | 管理员上传 |
| `rfq` | JPEG, PNG, PDF | 50MB | 需求附件 |
| `sample` | JPEG, PNG | 10MB | 样品照片 |
| `report` | JPEG, PNG, PDF | 50MB | 报告附件 |
| `certificate` | JPEG, PNG, PDF | 50MB | 证书附件 |
| `custom-testing` | JPEG, PNG, PDF | 50MB | 定制测试附件 |
| `settings` | JPEG, PNG | 5MB | 站点设置 |
| `general` | JPEG, PNG, PDF | 50MB | 通用上传 |

> **SVG is explicitly rejected** — `image/svg+xml` uploads are blocked at validation time to prevent XSS attacks via embedded scripts.

---

## Image Processing (sharp)

Images are automatically processed during upload:

| Feature | Default | Configurable |
|---------|---------|-------------|
| **Dimension extraction** | Enabled | — |
| **WebP conversion** | Enabled (non-WebP images) | `convertToWebP` |
| **Quality** | 85 | `webpQuality` (1-100) |
| **EXIF stripping** | Enabled | `stripExif` |
| **Thumbnail generation** | Enabled if width > 400px | `generateThumbnail`, `thumbnailWidth` |
| **Thumbnail format** | WebP, 80 quality | — |

Processing is graceful — if `sharp` fails for any reason, the original file is stored unchanged.

---

## Duplicate Detection

Every uploaded file is hashed with **SHA-256**. If a file with the same hash already exists in the `Media` table, a `MediaDuplicateError` is thrown (HTTP 409). This prevents redundant storage and bandwidth.

---

## Upload Quotas

Per-user limits are enforced server-side:

| Limit | Value |
|-------|-------|
| Daily max files | 100 |
| Daily max bytes | 500 MB |
| Monthly max files | 2,000 |
| Monthly max bytes | 10 GB |

Exceeded quotas throw `MediaQuotaExceededError` (HTTP 429).

---

## Retry Logic

All storage operations (upload, delete, signed URL generation) use exponential backoff:

- **3 retries** with base delay of 300ms
- Delays: 300ms → 600ms → 1200ms
- Storage failures after retries throw `MediaStorageError`

If a DB insert fails after a successful storage upload, the service attempts to **delete the orphaned storage file** automatically.

---

## API Endpoints

### Authenticated User Upload
```
POST /api/upload
Content-Type: multipart/form-data

Body:
  file        File     (required)
  context     string   (default: "general")
  folder      string   (default: context value)
  entityType  string   (optional)
  entityId    string   (optional)

Response (standardized envelope):
  {
    success: true,
    data: {
      id,            // Media record ID
      url,           // public URL
      key,           // storage key (UUID-based)
      size,          // file size in bytes
      mimeType,      // final MIME type
      filename,      // sanitized original name
      width,         // image width (null for non-images)
      height,        // image height (null for non-images)
      hash,          // SHA-256 of file content
      thumbnailUrl   // thumbnail URL if generated
    }
  }

Errors:
  400 — MediaValidationError (invalid type or size)
  409 — MediaDuplicateError (file already exists)
  429 — MediaQuotaExceededError (quota limit reached)
```

### Admin Upload (Unified Entry Point)
```
POST /api/admin/upload
Content-Type: multipart/form-data

Body:
  file        File     (required)
  folder      string   (default: "admin")
  entityType  string   (optional)
  entityId    string   (optional)

Auth: SUPER_ADMIN or FINANCE_ADMIN
Response (standardized envelope):
  { success: true, data: { id, url, key, size, mimeType, filename, width, height, hash, thumbnailUrl } }
```

> **This is the sole admin upload entry point.** All admin-panel file uploads — including QR codes, settings images, and documents — must pass through a `withAdminApi`-guarded route that delegates to `MediaService`. Direct filesystem writes or storage-provider calls from admin handlers are prohibited.

### Admin QR Code Upload
```
POST /api/admin/upload/qr-code
Content-Type: multipart/form-data

Body:
  file  File  (required, JPEG/PNG only, max 5MB)

Auth: SUPER_ADMIN or FINANCE_ADMIN
```

Thin wrapper over the unified upload pipeline with `folder: 'qr-codes'`, `generateThumbnail: false`, and `convertToWebP: false`.

### Base64 Upload (Admin / Rich Text)
```
POST /api/admin/upload
// Or use MediaService.uploadFromBase64() server-side

const result = await media.uploadFromBase64(
  'data:image/png;base64,iVBORw0KGgo...',
  'screenshot.png',
  { context: 'admin', uploadedBy: userId }
);
```

### Stream Upload
```ts
const stream = fs.createReadStream('./large-file.jpg');
const result = await media.uploadFromStream(
  stream, 'large-file.jpg', 'image/jpeg',
  { context: 'report', uploadedBy: userId }
);
```

### Batch Upload with Progress
```ts
const { results, errors } = await media.uploadMany(
  files,
  { context: 'sample', uploadedBy: userId },
  (progress) => {
    console.log(`${progress.current}/${progress.total}: ${progress.file} — ${progress.status}`);
  }
);
```

### List Media (Admin)
```
GET /api/admin/media?page=1&pageSize=20&context=admin&q=search

Auth: SUPER_ADMIN or FINANCE_ADMIN
Response:
  { success: true, data: [...], total, page, pageSize, totalPages }
```

### Get Single Media (Admin)
```
GET /api/admin/media/:id

Auth: SUPER_ADMIN or FINANCE_ADMIN
```

### Delete Media (Admin)
```
DELETE /api/admin/media/:id

Auth: SUPER_ADMIN or FINANCE_ADMIN
Soft-deletes the DB record and removes from storage (with retry).
```

### Batch Delete (Admin)
```
POST /api/admin/media
Content-Type: application/json

Body: { ids: string[] }

Auth: SUPER_ADMIN or FINANCE_ADMIN
```

### Cleanup Orphans (Admin)
```
POST /api/admin/media/cleanup

Auth: SUPER_ADMIN
Scans for Media records whose linked entity no longer exists
and soft-deletes them.
```

---

## Storage Configuration

Set `STORAGE_PROVIDER` environment variable:

```env
# Local filesystem (development)
STORAGE_PROVIDER=local
UPLOAD_DIR=./public/uploads

# Alibaba OSS (production)
STORAGE_PROVIDER=oss
OSS_BUCKET=your-bucket
OSS_REGION=oss-cn-hangzhou
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
OSS_PUBLIC_URL=https://your-bucket.oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY_ID=your-key-id
OSS_ACCESS_KEY_SECRET=your-key-secret
OSS_CACHE_CONTROL=max-age=31536000

# AWS S3
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket
S3_REGION=ap-southeast-1
S3_ENDPOINT=                    # leave empty for AWS native
S3_PUBLIC_URL=https://cdn.yoursite.com
S3_ACCESS_KEY_ID=your-key-id
S3_SECRET_ACCESS_KEY=your-secret
S3_CACHE_CONTROL=max-age=31536000
S3_SERVER_SIDE_ENCRYPTION=AES256

# Cloudflare R2
STORAGE_PROVIDER=r2
R2_BUCKET=your-bucket
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret
R2_CACHE_CONTROL=public, max-age=31536000

# MinIO
STORAGE_PROVIDER=minio
MINIO_BUCKET=your-bucket
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000/your-bucket
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
MINIO_REGION=us-east-1
```

### Provider Features

| Provider | Multipart Upload | Signed URLs | `exists()` | `list()` | Path Style |
|----------|-----------------|-------------|------------|----------|------------|
| `local` | — | — | ✅ | ✅ | — |
| `s3` | ✅ (>5MB) | ✅ | ✅ | ✅ | auto |
| `r2` | ✅ (>5MB) | ✅ | ✅ | ✅ | virtual |
| `minio` | ✅ (>5MB) | ✅ | ✅ | ✅ | path |
| `oss` | ✅ (>5MB) | ✅ | ✅ | ✅ | virtual |
| `dataurl` | — | — | ✅ | — | — |

### Multipart Upload

Files larger than **5MB** are automatically uploaded via S3 multipart (CreateMultipartUpload → UploadPart → CompleteMultipartUpload). Failed multipart uploads are automatically aborted to avoid orphaned parts.

### StorageProvider Interface

```ts
interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string, folder: string, key?: string): Promise<UploadResult>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string, maxKeys?: number, continuationToken?: string): Promise<StorageListResult>;
}
```

### Direct Storage Usage

```ts
import { getStorageProvider } from '@/lib/storage';

const storage = getStorageProvider();

// Check if a file exists
const exists = await storage.exists('general/abc-123.jpg');

// List files by prefix
const { items, nextContinuationToken } = await storage.list('general/', 50);

// Generate a temporary signed URL (private buckets)
const signedUrl = await storage.getSignedUrl('general/abc-123.jpg', 3600);

// Delete a file
await storage.delete('general/abc-123.jpg');
```

---

## Server-Side Usage

```ts
import { getMediaService } from '@/services/media-service';

const media = getMediaService();

// Upload with full processing
const result = await media.upload(
  { buffer, originalName: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 },
  {
    context: 'sample',
    folder: 'samples',
    entityType: 'Sample',
    entityId: '...',
    uploadedBy: 'user-id',
    generateThumbnail: true,
    convertToWebP: true,
    webpQuality: 90,
  }
);
// → { id, url, key, size, mimeType, filename, width, height, hash, thumbnailUrl }

// Base64 upload (e.g. from canvas/screenshot)
const result = await media.uploadFromBase64(
  'data:image/png;base64,iVBORw0KGgo...',
  'screenshot.png',
  { context: 'admin', uploadedBy: 'user-id' }
);

// Stream upload
const result = await media.uploadFromStream(
  readableStream, 'video.mp4', 'video/mp4',
  { context: 'report', uploadedBy: 'user-id' }
);

// Batch upload with progress
const { results, errors } = await media.uploadMany(
  files,
  { context: 'sample', uploadedBy: 'user-id' },
  (progress) => console.log(progress)
);

// List with filters
const { items, total } = await media.list({
  context: 'admin',
  page: 1,
  pageSize: 20,
});

// Delete
await media.delete('media-id');

// Hard delete (permanent)
await media.hardDelete('media-id');

// Cleanup orphans
const { cleaned, ids } = await media.cleanupOrphans();

// Backfill legacy uploads
const { total, created, errors } = await media.backfillFromLegacyTables();
```

---

## Error Types

| Error | HTTP | Cause |
|-------|------|-------|
| `MediaValidationError` | 400 | Invalid MIME type or file size |
| `MediaSecurityError` | 400 | Magic bytes mismatch or filename sanitization failure |
| `MediaQuotaExceededError` | 429 | User exceeded daily/monthly quota |
| `MediaDuplicateError` | 409 | File hash already exists |
| `MediaNotFoundError` | 404 | Media record not found |
| `MediaStorageError` | 500 | Storage operation failed after retries |

---

## Security

### No Direct Client Uploads (Hard Constraint)

**Direct client-side uploads to the storage bucket are STRICTLY FORBIDDEN.**

All uploads must flow through the server:

```
Client → POST /api/upload     → MediaService → Storage Provider
Client → POST /api/admin/upload → MediaService → Storage Provider
```

- **Storage credentials never reach the client.** S3/OSS access keys reside only in server environment variables and are consumed exclusively by `src/lib/storage.ts`.
- **`getSignedUrl()` is read-only.** The `StorageProvider` interface exposes `getSignedUrl()` which uses `GetObjectCommand` — generating temporary **download** URLs only. No `PutObjectCommand` presigned URLs are ever created or exposed.
- **`next.config.ts` does not expose env vars.** No `publicRuntimeConfig`, `serverRuntimeConfig`, or `env` passthrough leaks storage credentials to the browser bundle.
- **No client-side AWS SDK imports.** `@aws-sdk/client-s3` is never imported by any component in `src/components/`.

### Other Security Measures

- **Unified admin upload entry point** — `POST /api/admin/upload` (and its `withAdminApi`-guarded sub-routes like `/qr-code`) is the **only** way for the admin panel to upload files. No admin route may write directly to storage or the filesystem.
- **MIME type whitelisting** per context — no executable or dangerous file types
- **UUID filenames** — original filenames are never exposed in storage keys (`{folder}/{uuid}.{ext}`)
- **Extension normalization** — storage extension is derived from the **validated MIME type**, not the original filename
- **Strict MIME whitelist** — only `image/jpeg`, `image/png`, `application/pdf` are accepted
- **Explicit SVG rejection** — `image/svg+xml` is blocked at validation to prevent XSS via embedded `<script>` elements
- **Magic bytes validation** — file signatures (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, PDF: `%PDF`) are verified against the claimed MIME type before processing
- **Filename sanitization** — original names are stripped of path components, control characters, and null bytes before DB storage (max 255 chars)
- **Double-extension protection** — only the canonical extension from the MIME whitelist is used; unknown extensions fall back to `.bin`
- **Size limits** — enforced before any storage operation
- **Hash deduplication** — prevents redundant file storage
- **Upload quotas** — per-user daily/monthly limits prevent abuse
- **Automatic audit logging** — `MediaService.upload()` writes a mandatory `AuditLog` entry (`action: 'UPLOAD_FILE'`) with metadata `{ url, key, size, mimeType, folder, context }` for every successful upload. This is enforced at the service layer and cannot be bypassed by any route.
- **Soft deletes** — Media records are soft-deleted; storage files are hard-deleted
- **Transaction safety** — orphaned storage files are cleaned up if DB insert fails
- **EXIF stripping** — removes potentially sensitive metadata from images
