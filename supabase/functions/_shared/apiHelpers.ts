/**
 * Shared API Helpers for Edge Functions
 * Provides unified CORS, authentication, error handling, and response formatting
 */

// CORS Headers for all API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Standard API Response interface
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

// HTTP Status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error codes for API responses
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/**
 * Create a successful JSON response
 */
export function successResponse<T>(
  data: T,
  status: number = HttpStatus.OK,
  meta?: ApiResponse['meta']
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  details?: unknown
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  
  console.error(`[API Error] ${code}: ${message}`, details);
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Parse request body safely
 */
export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await req.json();
    }
    
    return null;
  } catch (error) {
    console.error('[API] Failed to parse request body:', error);
    return null;
  }
}

/**
 * Parse URL parameters
 */
export function parseParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * Extract path segments from URL
 * Example: /api/families/123/members → ['families', '123', 'members']
 */
export function getPathSegments(url: URL): string[] {
  return url.pathname
    .split('/')
    .filter(segment => segment && segment !== 'api');
}

/**
 * Get resource ID from path
 * Example: /api/families/123 → '123'
 */
export function getResourceId(url: URL, resourceIndex: number = 1): string | null {
  const segments = getPathSegments(url);
  return segments[resourceIndex] || null;
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
  };
}

/**
 * Parse pagination params from URL
 */
export function getPaginationParams(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Method router for handling different HTTP methods
 */
export type MethodHandler = (req: Request, url: URL) => Promise<Response>;

export interface MethodHandlers {
  GET?: MethodHandler;
  POST?: MethodHandler;
  PUT?: MethodHandler;
  PATCH?: MethodHandler;
  DELETE?: MethodHandler;
}

export async function routeByMethod(
  req: Request,
  url: URL,
  handlers: MethodHandlers
): Promise<Response> {
  const method = req.method.toUpperCase() as keyof MethodHandlers;
  const handler = handlers[method];
  
  if (!handler) {
    return errorResponse(
      ErrorCodes.METHOD_NOT_ALLOWED,
      `Method ${method} not allowed`,
      HttpStatus.METHOD_NOT_ALLOWED
    );
  }
  
  return handler(req, url);
}

/**
 * Log API request for debugging
 */
export function logRequest(req: Request, url: URL): void {
  console.log(`[API] ${req.method} ${url.pathname}${url.search}`);
}

/**
 * Wrap handler with error catching
 */
export async function withErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
