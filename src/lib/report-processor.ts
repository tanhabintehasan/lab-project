import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { createHmac } from 'crypto';

/**
 * Derive a deterministic PDF password from order and report numbers.
 * The password is never stored; it is recomputed on demand.
 */
export function deriveReportPassword(orderNo: string, reportNo: string): string {
  const secret = process.env.PDF_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      'PDF_ENCRYPTION_SECRET is not set. ' +
        'Add it to your environment variables to enable report password derivation.'
    );
  }
  return createHmac('sha256', secret)
    .update(`${orderNo}:${reportNo}`)
    .digest('base64url')
    .slice(0, 16);
}

/**
 * Fetch a file buffer from a URL (public HTTP) or local filesystem path.
 */
export async function fetchFileBuffer(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    return Buffer.from(base64, 'base64');
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // Local filesystem path (e.g. /uploads/reports/...)
  const { readFile } = await import('fs/promises');
  const baseDir = process.env.UPLOAD_DIR || './public/uploads';
  const cleanPath = url.replace(/^\/uploads\//, '');
  const fullPath = `${baseDir}/${cleanPath}`;
  return readFile(fullPath);
}

interface ProcessReportOptions {
  buffer: Buffer;
  signerName: string;
  signerRole: string;
  password: string;
}

/**
 * Process a raw PDF report:
 * 1. Add a digital signature placeholder (name + timestamp) on the final page
 * 2. Encrypt the PDF with the derived password
 */
export async function processReportPdf(options: ProcessReportOptions): Promise<Buffer> {
  const { buffer, signerName, signerRole, password } = options;

  const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width, height } = lastPage.getSize();

  const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  const boldFont = pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);

  const now = new Date();
  const timestamp = now.toISOString();
  const displayDate = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Signature box dimensions
  const boxWidth = 320;
  const boxHeight = 90;
  const margin = 40;
  const x = width - boxWidth - margin;
  const y = margin;

  // Draw border
  lastPage.drawRectangle({
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    borderWidth: 1,
    borderColor: rgb(0.2, 0.4, 0.6),
    color: rgb(0.96, 0.98, 1.0),
  });

  // Title
  lastPage.drawText('DIGITAL SIGNATURE', {
    x: x + 12,
    y: y + boxHeight - 22,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.3, 0.5),
  });

  // Signer name
  lastPage.drawText(`Signed by: ${signerName}`, {
    x: x + 12,
    y: y + boxHeight - 40,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Role
  lastPage.drawText(`Role: ${signerRole}`, {
    x: x + 12,
    y: y + boxHeight - 55,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Timestamp
  lastPage.drawText(`Timestamp: ${displayDate}`, {
    x: x + 12,
    y: y + boxHeight - 70,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add metadata
  pdfDoc.setTitle('Laboratory Test Report');
  pdfDoc.setAuthor(signerName);
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  // Encrypt and save
  const processed = await pdfDoc.save({
    useObjectStreams: true,
    password,
    ownerPassword: password,
  });

  return Buffer.from(processed);
}
