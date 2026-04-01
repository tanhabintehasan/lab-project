/**
 * Centralized API Client
 * Handles all API requests with consistent error handling and auth
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'APIError';
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Base API client with auth handling
 */
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;

    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {})
    };

    // Add auth token from cookie (automatic in browser)
    // Next.js handles cookies automatically

    const config: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: 'include' // Include cookies
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJSON = contentType?.includes('application/json');

      if (!response.ok) {
        let errorData;
        if (isJSON) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }

        throw new APIError(
          response.status,
          response.statusText,
          errorData
        );
      }

      // Parse response
      if (isJSON) {
        return await response.json();
      } else {
        return (await response.text()) as any;
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network or parsing error
      throw new APIError(
        0,
        'Network Error',
        { message: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Type-safe API response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Helper to extract data from API response
 */
export function extractData<T>(response: APIResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'API request failed');
  }
  return response.data as T;
}
