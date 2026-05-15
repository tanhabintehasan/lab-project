/**
 * Admin Translation JSON API
 *
 * GET  /api/admin/translations/json
 *      Read all locale files, flatten, and return analysis including missing keys.
 *
 * PUT  /api/admin/translations/json
 *      Validate and write back a locale file. Atomic write with backup.
 */

import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-helpers';
import { apiValidationError, apiError } from '@/lib/api-response';
import { JWTPayload } from '@/lib/auth';
import {
  readAllLocales,
  writeLocaleFile,
  analyzeTranslations,
  mergeTranslations,
  validateFlatTranslations,
} from '@/lib/translation-json';
import { z } from 'zod';

export const runtime = 'nodejs';

// ─── GET ───────────────────────────────────────────────────────

const getHandler = async (_request: NextRequest, _user: JWTPayload) => {
  try {
    const localesData = await readAllLocales();
    const analysis = analyzeTranslations(localesData);

    return successResponse({
      locales: analysis.locales,
      allKeys: analysis.allKeys,
      values: analysis.values,
      missingKeys: analysis.missingKeys,
      namespaces: analysis.namespaces,
      stats: analysis.stats,
    });
  } catch (err: any) {
    console.error('[Translations JSON GET]', err);
    return errorResponse(err.message || '读取翻译文件失败', 500);
  }
};

// ─── PUT ───────────────────────────────────────────────────────

const putSchema = z.object({
  locale: z.string().min(1),
  updates: z.record(z.string(), z.string().nullable()).optional(),
  fullReplace: z.boolean().optional(),
  translations: z.record(z.string(), z.string().nullable()).optional(),
});

const putHandler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = putSchema.parse(body);

    const { locale } = data;
    const isFullReplace = data.fullReplace === true;
    const incoming = isFullReplace
      ? (data.translations || {})
      : (data.updates || {});

    if (!locale.match(/^[a-zA-Z0-9_-]+$/)) {
      return errorResponse('Invalid locale format', 400);
    }

    // Read current state to know what we're merging against
    const localesData = await readAllLocales();
    const currentFlat = localesData[locale] || {};

    let newFlat: Record<string, string>;
    if (isFullReplace) {
      // Full replace: filter out nulls, validate the rest
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(incoming)) {
        if (v !== null && v !== undefined) filtered[k] = v;
      }
      newFlat = filtered;
    } else {
      // Patch mode: merge updates into existing
      newFlat = mergeTranslations(currentFlat, incoming);
    }

    // Validate before writing
    const validation = validateFlatTranslations(newFlat);
    if (!validation.valid) {
      return apiValidationError(
        `验证失败: ${validation.errors.join('; ')}`,
        { validationErrors: validation.errors }
      );
    }

    // Write atomically with backup
    const writeResult = await writeLocaleFile(locale, newFlat, { createBackup: true });
    if (!writeResult.success) {
      return apiError(
        `保存失败: ${writeResult.errors.join('; ')}`,
        500,
        { details: { validationErrors: writeResult.errors } }
      );
    }

    // Re-read to return fresh state
    const freshLocalesData = await readAllLocales();
    const freshAnalysis = analyzeTranslations(freshLocalesData);

    return successResponse({
      locale,
      saved: true,
      locales: freshAnalysis.locales,
      allKeys: freshAnalysis.allKeys,
      values: freshAnalysis.values,
      missingKeys: freshAnalysis.missingKeys,
      namespaces: freshAnalysis.namespaces,
      stats: freshAnalysis.stats,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message || '参数无效', 400);
    }
    console.error('[Translations JSON PUT]', err);
    return errorResponse(err.message || '保存翻译文件失败', 500);
  }
};

// ─── POST (batch update multiple locales) ──────────────────────

const postSchema = z.object({
  batches: z.array(
    z.object({
      locale: z.string().min(1),
      updates: z.record(z.string(), z.string().nullable()),
    })
  ),
});

const postHandler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = postSchema.parse(body);

    const localesData = await readAllLocales();
    const results: { locale: string; success: boolean; errors: string[] }[] = [];

    for (const batch of data.batches) {
      const currentFlat = localesData[batch.locale] || {};
      const newFlat = mergeTranslations(currentFlat, batch.updates);

      const validation = validateFlatTranslations(newFlat);
      if (!validation.valid) {
        results.push({ locale: batch.locale, success: false, errors: validation.errors });
        continue;
      }

      const writeResult = await writeLocaleFile(batch.locale, newFlat, { createBackup: true });
      results.push({ locale: batch.locale, success: writeResult.success, errors: writeResult.errors });
    }

    const allSuccess = results.every(r => r.success);
    if (!allSuccess) {
      return apiError('部分保存失败', 400, { details: { results } });
    }

    const freshLocalesData = await readAllLocales();
    const freshAnalysis = analyzeTranslations(freshLocalesData);

    return successResponse({
      saved: true,
      results,
      locales: freshAnalysis.locales,
      allKeys: freshAnalysis.allKeys,
      values: freshAnalysis.values,
      missingKeys: freshAnalysis.missingKeys,
      namespaces: freshAnalysis.namespaces,
      stats: freshAnalysis.stats,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse(err.issues[0]?.message || '参数无效', 400);
    }
    console.error('[Translations JSON POST]', err);
    return errorResponse(err.message || '批量保存失败', 500);
  }
};

export const GET = withAuth(getHandler, ['SUPER_ADMIN']);
export const PUT = withAuth(putHandler, ['SUPER_ADMIN']);
export const POST = withAuth(postHandler, ['SUPER_ADMIN']);
