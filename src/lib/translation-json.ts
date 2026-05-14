/**
 * Translation JSON utilities for the admin translation editor.
 * Handles flattening/unflattening of nested locale JSON files,
 * structure validation, and missing-key detection across locales.
 */

import { promises as fs } from 'fs';
import path from 'path';

export const MESSAGES_DIR = path.join(process.cwd(), 'messages');

export interface TranslationEntry {
  key: string;
  values: Record<string, string | null>; // locale -> value (null if missing)
  namespaces: string[];
}

export interface TranslationAnalysis {
  locales: string[];
  allKeys: string[];
  values: Record<string, Record<string, string | null>>;
  missingKeys: Record<string, string[]>; // locale -> keys missing in that locale
  namespaces: string[];
  stats: {
    totalKeys: number;
    missingCount: number;
    keysPerLocale: Record<string, number>;
  };
}

/** Recursively flatten a nested JSON object into dot-notation keys. */
export function flattenTranslations(
  obj: unknown,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // next-intl can handle primitives; store as string for editing
      result[fullKey] = String(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenTranslations(value, fullKey, result);
    }
    // Arrays are skipped — next-intl does not support array translations
  }

  return result;
}

/** Reconstruct a nested JSON object from flat dot-notation keys. */
export function unflattenTranslations(flat: Record<string, string>): unknown {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: any = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  return result;
}

/** Extract top-level namespaces from a set of dot-notation keys. */
export function extractNamespaces(keys: string[]): string[] {
  const set = new Set<string>();
  for (const key of keys) {
    const first = key.split('.')[0];
    if (first) set.add(first);
  }
  return Array.from(set).sort();
}

/** Validate that a flat translations object is safe to save. */
export function validateFlatTranslations(flat: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!flat || typeof flat !== 'object' || Array.isArray(flat)) {
    return { valid: false, errors: ['Translations must be a plain object'] };
  }

  const keyPattern = /^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)*$/;

  for (const [key, value] of Object.entries(flat)) {
    if (!keyPattern.test(key)) {
      errors.push(`Invalid key format: "${key}"`);
    }
    if (typeof value !== 'string') {
      errors.push(`Value for "${key}" must be a string, got ${typeof value}`);
    }
  }

  // Ensure unflattening produces a valid object
  try {
    const unflattened = unflattenTranslations(flat);
    const json = JSON.stringify(unflattened);
    JSON.parse(json); // sanity check
  } catch (err: any) {
    errors.push(`Structure validation failed: ${err.message}`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a full nested JSON translation object. */
export function validateTranslationJson(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, errors: ['Root must be a JSON object'] };
  }

  function walk(node: unknown, path: string) {
    if (node === null || typeof node !== 'object') {
      if (typeof node !== 'string' && typeof node !== 'number' && typeof node !== 'boolean') {
        errors.push(`Invalid value type at "${path}": ${typeof node}`);
      }
      return;
    }
    if (Array.isArray(node)) {
      errors.push(`Arrays are not supported at "${path}"`);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.includes('.') || key.includes('[') || key.includes(']')) {
        errors.push(`Invalid character in key at "${path}.${key}"`);
      }
      walk(value, path ? `${path}.${key}` : key);
    }
  }

  walk(obj, '');
  return { valid: errors.length === 0, errors };
}

/** Read all locale files from the messages directory. */
export async function readAllLocales(): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};

  try {
    const entries = await fs.readdir(MESSAGES_DIR, { withFileTypes: true });
    const jsonFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));

    for (const file of jsonFiles) {
      const locale = file.name.replace(/\.json$/, '');
      const content = await fs.readFile(path.join(MESSAGES_DIR, file.name), 'utf-8');
      const parsed = JSON.parse(content);
      result[locale] = flattenTranslations(parsed);
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }

  return result;
}

/** Write a single locale file atomically with validation and backup. */
export async function writeLocaleFile(
  locale: string,
  flatTranslations: Record<string, string>,
  options: { createBackup?: boolean } = {}
): Promise<{ success: boolean; errors: string[] }> {
  const validation = validateFlatTranslations(flatTranslations);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const unflattened = unflattenTranslations(flatTranslations);
  const jsonContent = JSON.stringify(unflattened, null, 2) + '\n';

  // Verify round-trip integrity
  try {
    const reparsed = JSON.parse(jsonContent);
    const roundTripFlat = flattenTranslations(reparsed);
    const originalKeys = Object.keys(flatTranslations).sort();
    const roundTripKeys = Object.keys(roundTripFlat).sort();
    if (JSON.stringify(originalKeys) !== JSON.stringify(roundTripKeys)) {
      return {
        success: false,
        errors: ['Round-trip validation failed: keys changed after serialization'],
      };
    }
  } catch (err: any) {
    return { success: false, errors: [`Round-trip validation failed: ${err.message}`] };
  }

  // Create backup if file exists
  if (options.createBackup !== false) {
    try {
      await fs.access(filePath);
      const backupPath = path.join(MESSAGES_DIR, `.${locale}.json.backup-${Date.now()}`);
      await fs.copyFile(filePath, backupPath);
    } catch {
      // File doesn't exist yet, no backup needed
    }
  }

  // Atomic write via temp file
  const tempPath = filePath + '.tmp';
  await fs.writeFile(tempPath, jsonContent, 'utf-8');
  await fs.rename(tempPath, filePath);

  return { success: true, errors: [] };
}

/** Analyze locales for missing keys and stats. */
export function analyzeTranslations(
  localesData: Record<string, Record<string, string>>
): TranslationAnalysis {
  const locales = Object.keys(localesData).sort();
  const allKeySet = new Set<string>();

  for (const data of Object.values(localesData)) {
    for (const key of Object.keys(data)) {
      allKeySet.add(key);
    }
  }

  const allKeys = Array.from(allKeySet).sort();
  const values: Record<string, Record<string, string | null>> = {};
  const missingKeys: Record<string, string[]> = {};
  const keysPerLocale: Record<string, number> = {};

  for (const locale of locales) {
    missingKeys[locale] = [];
    keysPerLocale[locale] = 0;
    const localeData = localesData[locale] || {};

    for (const key of allKeys) {
      if (!values[key]) values[key] = {};
      if (key in localeData) {
        values[key][locale] = localeData[key];
        keysPerLocale[locale]++;
      } else {
        values[key][locale] = null;
        missingKeys[locale].push(key);
      }
    }
  }

  const totalMissing = Object.values(missingKeys).reduce((sum, arr) => sum + arr.length, 0);

  return {
    locales,
    allKeys,
    values,
    missingKeys,
    namespaces: extractNamespaces(allKeys),
    stats: {
      totalKeys: allKeys.length,
      missingCount: totalMissing,
      keysPerLocale,
    },
  };
}

/** Merge new/updated keys into an existing flat translation set. */
export function mergeTranslations(
  existing: Record<string, string>,
  updates: Record<string, string | null>
): Record<string, string> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  return merged;
}
