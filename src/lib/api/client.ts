/**
 * API Client for Supabase Edge Functions
 * Provides a unified interface for calling backend APIs
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
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
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

// Request options
interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Make an API request to an Edge Function
 */
async function request<T>(
  functionName: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: RequestOptions = {}
): Promise<T> {
  const { body, params } = options;

  // Build request body - merge params directly into body
  // Edge functions expect action and other params directly in JSON body
  const requestBody: Record<string, unknown> = {};
  
  // Add params directly to body (action, id, familyId, etc.)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        requestBody[key] = value;
      }
    });
  }

  // Merge body for POST/PUT/PATCH/DELETE
  if (body && typeof body === 'object') {
    Object.assign(requestBody, body);
  }

  console.log(`[API] ${method} ${functionName}`, requestBody);

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: requestBody,
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
 * API Client with typed methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(
    functionName: string,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>(functionName, 'GET', { params }),

  /**
   * POST request
   */
  post: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>(functionName, 'POST', { body, params }),

  /**
   * PUT request
   */
  put: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>(functionName, 'PUT', { body, params }),

  /**
   * PATCH request
   */
  patch: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>(functionName, 'PATCH', { body, params }),

  /**
   * DELETE request
   */
  delete: <T>(
    functionName: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>(functionName, 'DELETE', { body, params }),
};

export default apiClient;
