/**
 * Safe fetch wrapper that prevents `Unexpected end of JSON input` crashes.
 * Always returns a structured object so callers don't need defensive try/catch.
 */

export interface SafeFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safely fetch JSON from an API endpoint.
 * - Checks response.ok before parsing
 * - Handles non-JSON responses gracefully
 * - Never throws (returns { ok: false, error: ... } instead)
 */
export async function safeFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (networkErr) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkErr instanceof Error ? networkErr.message : 'Network error',
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      status: response.status,
      data: null,
      error: text || `HTTP ${response.status}`,
    };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    return {
      ok: true,
      status: response.status,
      data: text as unknown as T,
      error: null,
    };
  }

  try {
    const data = (await response.json()) as T;
    return {
      ok: true,
      status: response.status,
      data,
      error: null,
    };
  } catch (parseErr) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: parseErr instanceof Error ? parseErr.message : 'Invalid JSON',
    };
  }
}

/**
 * Convenience helper for JSON APIs that wrap responses in `{ success, data }`.
 * Returns the inner `data` field when `success === true`.
 */
export async function safeApiCall<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  const result = await safeFetch<{ success: boolean; data: T; error?: string }>(url, init);
  if (!result.ok || !result.data) {
    return {
      data: null,
      error: result.error || 'Request failed',
    };
  }
  const payload = result.data;
  if ('success' in payload && payload.success === false) {
    return {
      data: null,
      error: payload.error || 'API returned success: false',
    };
  }
  const extracted = 'data' in payload ? payload.data : (payload as unknown as T);
  return {
    data: extracted ?? null,
    error: null,
  };
}
