/**
 * API Client for Supabase Edge Functions (REST)
 * Provides a unified interface for calling backend APIs using proper HTTP methods
 */

import { supabase } from '@/integrations/supabase/client';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// API Error class
export class ApiError extends Error {
  code: string;
  details?: unknown;
  status?: number;

  constructor(code: string, message: string, details?: unknown, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

/**
 * Build query string from params
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Make an API request to an Edge Function
 */
async function request<T>(
  functionName: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  params?: Record<string, string | number | boolean | undefined | null>,
  body?: unknown
): Promise<T> {
  // Build function name with query string for Supabase
  const queryString = buildQueryString(params);
  
  console.log(`[API] ${method} ${functionName}${queryString}`, body || '');

  const { data, error } = await supabase.functions.invoke(functionName + queryString, {
    method,
    body: body || undefined,
  });

  if (error) {
    console.error(`[API] Error calling ${functionName}:`, error);
    throw new ApiError(
      'FUNCTION_ERROR',
      error.message || 'Failed to call API',
      error
    );
  }

  const response = data as ApiResponse<T>;

  if (!response.success) {
    throw new ApiError(
      response.error?.code || 'UNKNOWN_ERROR',
      response.error?.message || 'An error occurred',
      response.error?.details
    );
  }

  return response.data as T;
}

/**
 * REST API Client
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(
    functionName: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ) => request<T>(functionName, 'GET', params),

  /**
   * POST request
   */
  post: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>
  ) => request<T>(functionName, 'POST', params, body),

  /**
   * PUT request
   */
  put: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>
  ) => request<T>(functionName, 'PUT', params, body),

  /**
   * PATCH request
   */
  patch: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>
  ) => request<T>(functionName, 'PATCH', params, body),

  /**
   * DELETE request
   */
  delete: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>
  ) => request<T>(functionName, 'DELETE', params, body),
};

export default apiClient;
